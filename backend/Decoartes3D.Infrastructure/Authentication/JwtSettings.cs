using System.ComponentModel.DataAnnotations;

namespace Decoartes3D.Infrastructure.Authentication;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    [Required]
    public string Issuer { get; init; } = string.Empty;

    [Required]
    public string Audience { get; init; } = string.Empty;

    /// <summary>
    /// Clave HMAC-SHA256: mínimo 32 caracteres. Nunca en appsettings.json de producción:
    /// usar user-secrets en desarrollo y variables de entorno (Jwt__SecretKey) en producción.
    /// </summary>
    [Required, MinLength(32)]
    public string SecretKey { get; init; } = string.Empty;

    [Range(5, 60 * 24 * 30)]
    public int ExpirationMinutes { get; init; } = 60 * 24;
}
