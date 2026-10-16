using Decoartes3D.API.Configuration;
using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Auth;
using Decoartes3D.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Decoartes3D.API.Controllers;

[Route("api/auth")]
public class AuthController(IAuthService authService) : ApiControllerBase
{
    public record CurrentUserResponse(int UserId, string Email, string FirstName, string LastName, string Role);

    /// <summary>Crea una cuenta de cliente y devuelve un token de sesión.</summary>
    [HttpPost("register")]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken) =>
        FromResult(await authService.RegisterAsync(request, cancellationToken));

    /// <summary>Inicia sesión con email y contraseña.</summary>
    [HttpPost("login")]
    [EnableRateLimiting(RateLimitPolicies.Auth)]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken) =>
        FromResult(await authService.LoginAsync(request, cancellationToken));

    /// <summary>Datos del usuario autenticado, leídos del token.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    public ActionResult<CurrentUserResponse> Me() => new CurrentUserResponse(
        CurrentUserId ?? 0,
        User.FindFirst(AppClaims.Email)?.Value ?? string.Empty,
        User.FindFirst("given_name")?.Value ?? string.Empty,
        User.FindFirst("family_name")?.Value ?? string.Empty,
        User.FindFirst(AppClaims.Role)?.Value ?? string.Empty);
}
