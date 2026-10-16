using Decoartes3D.Domain.Enums;

namespace Decoartes3D.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsActive { get; set; } = true;

    public ICollection<Order> Orders { get; set; } = [];

    public string FullName => $"{FirstName} {LastName}".Trim();
}
