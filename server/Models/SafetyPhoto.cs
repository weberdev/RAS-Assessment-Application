namespace server.Models;

public class SafetyPhoto
{
    public int Id { get; set; }

    public int SafetySubmissionId { get; set; }

    public SafetySubmission Submission { get; set; } = null!;

    public string FileName { get; set; } = string.Empty;
}