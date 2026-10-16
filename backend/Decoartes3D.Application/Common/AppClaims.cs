namespace Decoartes3D.Application.Common;

/// <summary>
/// Nombres de claims del JWT. Cortos a propósito: el frontend los lee directamente del token.
/// </summary>
public static class AppClaims
{
    public const string UserId = "sub";
    public const string Email = "email";
    public const string Role = "role";
}

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Customer = "Customer";
}
