using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Identity;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;


var builder = WebApplication.CreateBuilder(args);
builder.Services.AddDbContext<SafetyDbContext>(options =>
    options.UseSqlite("Data Source=safety.db"));

builder.Services.AddOpenApi();

//We have to be coarse here.
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key is missing.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<IPasswordHasher<SafetyUser>, PasswordHasher<SafetyUser>>();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SafetyDbContext>();
    var hasher = scope.ServiceProvider
        .GetRequiredService<IPasswordHasher<SafetyUser>>();

    db.Database.EnsureCreated();

    if (!db.Users.Any())
    {
        var framer = new SafetyUser
        {
            Name = "Demo Framer",
            Email = "framer@example.com",
            Role = "Framer"
        };

        framer.PasswordHash = hasher.HashPassword(
            framer, "FramerDemo2026!");

        var admin = new SafetyUser
        {
            Name = "Demo Administrator",
            Email = "admin@example.com",
            Role = "Admin"
        };

        admin.PasswordHash = hasher.HashPassword(
            admin, "AdminDemo2026!");

        db.Users.AddRange(framer, admin);
        db.SaveChanges();
    }
}

app.UseCors("ReactApp");
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "ok"
    });
});

app.MapPost("/api/submissions", async (
    SafetySubmissionRequest request,
    SafetyDbContext db,
    HttpContext context) =>
{
    var submission = new SafetySubmission
    {
        Site = request.Site,
        Date = request.Date,
        PpeWorn = request.Checklist.PpeWorn,
        FallProtection = request.Checklist.FallProtection,
        LaddersScaffolding = request.Checklist.LaddersScaffolding,
        ToolsAndCords = request.Checklist.ToolsAndCords,
        HazardsIdentified = request.Checklist.HazardsIdentified,
        Notes = request.Notes,
        SafetyUserId = int.Parse(
    context.User.FindFirst(ClaimTypes.NameIdentifier)!.Value),
    };

    db.Submissions.Add(submission);
    await db.SaveChangesAsync();

    return Results.Created(
        $"/api/submissions/{submission.Id}",
        submission
    );
}).RequireAuthorization();

app.MapGet("/api/submissions", async (
    SafetyDbContext db,
    HttpContext context) =>
{
    var userId = int.Parse(
        context.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    var isAdmin = context.User.IsInRole("Admin");

var query = db.Submissions
    .Include(s => s.Photos)
    .Include(s => s.User)
    .AsNoTracking()
    .AsQueryable();

    if (!isAdmin)
    {
        query = query.Where(s => s.SafetyUserId == userId);
    }

    var submissions = await query.ToListAsync();

    return Results.Ok(submissions.Select(s => new
    {
        s.Id,
        s.Site,
        s.Date,
        WorkerName = s.User.Name,
        s.PpeWorn,
        s.FallProtection,
        s.LaddersScaffolding,
        s.ToolsAndCords,
        s.HazardsIdentified,
        s.Notes,
        Photos = s.Photos.Select(p => new
        {
            p.Id,
            Url = $"/api/photos/{p.Id}"
        })
    }));
}).RequireAuthorization();

app.MapPost("/api/submissions/{id:int}/photos", async (
    int id,
    IFormFile file,
    SafetyDbContext db,
    IWebHostEnvironment environment,
    HttpContext context) =>
{
    var submission = await db.Submissions.FindAsync(id);

    if (submission is null)
        return Results.NotFound("Submission not found.");
    var userId = int.Parse(
    context.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

if (submission.SafetyUserId != userId &&
    !context.User.IsInRole("Admin"))
{
    return Results.Forbid();
}

    if (file.Length == 0 || file.Length > 10 * 1024 * 1024)
        return Results.BadRequest("File must be between 1 byte and 10 MB.");

    var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };

    if (!allowedTypes.Contains(file.ContentType))
        return Results.BadRequest("Only JPEG, PNG, and WebP images are allowed.");

    var uploadsDirectory = Path.Combine(
        environment.ContentRootPath, "uploads");

    Directory.CreateDirectory(uploadsDirectory);

    var fileName = $"{Guid.NewGuid():N}{Path.GetExtension(file.FileName)}";
    var filePath = Path.Combine(uploadsDirectory, fileName);

    await using (var stream = File.Create(filePath))
    {
        await file.CopyToAsync(stream);
    }

    var photo = new SafetyPhoto
    {
        SafetySubmissionId = id,
        FileName = fileName
    };

    db.Photos.Add(photo);
    await db.SaveChangesAsync();

    return Results.Created(
        $"/api/photos/{photo.Id}",
        new { photo.Id, photo.FileName }
    );
}).DisableAntiforgery().RequireAuthorization();

app.MapGet("/api/photos/{id:int}", async (
    int id,
    SafetyDbContext db,
    IWebHostEnvironment environment,
    HttpContext context) =>
{
    var photo = await db.Photos.FindAsync(id);

    if (photo is null)
        return Results.NotFound();
    var userId = int.Parse(
    context.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

var submission = await db.Submissions.FindAsync(
    photo.SafetySubmissionId);

if (submission is null)
    return Results.NotFound();

if (submission.SafetyUserId != userId &&
    !context.User.IsInRole("Admin"))
{
    return Results.Forbid();
}

    var filePath = Path.Combine(
        environment.ContentRootPath,
        "uploads",
        photo.FileName
    );

    if (!File.Exists(filePath))
        return Results.NotFound();

    var contentType = Path.GetExtension(photo.FileName).ToLowerInvariant() switch
{
    ".jpg" or ".jpeg" => "image/jpeg",
    ".png" => "image/png",
    ".webp" => "image/webp",
    _ => "application/octet-stream"
};

return Results.File(filePath, contentType);
}).RequireAuthorization();

app.MapPost("/api/login", async (
    LoginRequest request,
    SafetyDbContext db,
    IPasswordHasher<SafetyUser> hasher,
    IConfiguration configuration) =>
{
    var user = await db.Users
        .SingleOrDefaultAsync(u => u.Email == request.Email);

    if (user is null)
        return Results.Unauthorized();

    var verification = hasher.VerifyHashedPassword(
        user, user.PasswordHash, request.Password);

    if (verification == PasswordVerificationResult.Failed)
        return Results.Unauthorized();

    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Name),
        new Claim(ClaimTypes.Role, user.Role)
    };

    var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));

    var credentials = new SigningCredentials(
        key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddHours(8),
        signingCredentials: credentials
    );

    var tokenString = new JwtSecurityTokenHandler()
        .WriteToken(token);

    return Results.Ok(new
    {
        token = tokenString,
        name = user.Name,
        role = user.Role
    });
});


app.Run();


record LoginRequest(string Email, string Password);

record SafetyChecklist(
    bool PpeWorn,
    bool FallProtection,
    bool LaddersScaffolding,
    bool ToolsAndCords,
    bool HazardsIdentified
);

record SafetySubmissionRequest(
    string Site,
    DateOnly Date,
    SafetyChecklist Checklist,
    string? Notes
);