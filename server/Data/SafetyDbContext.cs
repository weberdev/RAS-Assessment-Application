using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data;

public class SafetyDbContext : DbContext
{
    public SafetyDbContext(DbContextOptions<SafetyDbContext> options)
        : base(options)
    {
    }

    public DbSet<SafetySubmission> Submissions => Set<SafetySubmission>();
    public DbSet<SafetyPhoto> Photos => Set<SafetyPhoto>();
    public DbSet<SafetyUser> Users => Set<SafetyUser>();
}