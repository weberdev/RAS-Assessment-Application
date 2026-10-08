namespace server.Models;

public class SafetySubmission
{
    public int Id { get; set; }

    public string Site { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    public bool PpeWorn { get; set; }

    public bool FallProtection { get; set; }

    public bool LaddersScaffolding { get; set; }

    public bool ToolsAndCords { get; set; }

    public bool HazardsIdentified { get; set; }

    public string? Notes { get; set; }
    public List<SafetyPhoto> Photos { get; set; } = new();
    public int SafetyUserId { get; set; }

    public SafetyUser User { get; set; } = null!;
}