using Decoartes3D.Application.DTOs.Auth;
using Decoartes3D.Application.Interfaces;
using Decoartes3D.Domain.Common;
using Decoartes3D.Domain.Entities;
using Decoartes3D.Domain.Enums;
using Decoartes3D.Domain.Interfaces;
using Decoartes3D.Domain.Interfaces.Repositories;

namespace Decoartes3D.Application.Services;

public class AuthService(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IUnitOfWork unitOfWork) : IAuthService
{
    private const string InvalidCredentials = "Email o contraseña incorrectos.";

    public async Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var email = NormalizeEmail(request.Email);

        if (await userRepository.EmailExistsAsync(email, cancellationToken))
            return Result.Conflict<AuthResponse>("Ya existe una cuenta con ese email.");

        var user = new User
        {
            Email = email,
            PasswordHash = passwordHasher.Hash(request.Password),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Role = UserRole.Customer,
            IsActive = true
        };

        await userRepository.AddAsync(user, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(BuildResponse(user));
    }

    public async Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByEmailAsync(NormalizeEmail(request.Email), cancellationToken);

        // Mismo mensaje para email inexistente y contraseña errónea: no revela qué emails están registrados.
        if (user is null || !passwordHasher.Verify(request.Password, user.PasswordHash))
            return Result.Unauthorized<AuthResponse>(InvalidCredentials);

        if (!user.IsActive)
            return Result.Failure<AuthResponse>("La cuenta está desactivada.", ErrorType.Forbidden);

        return Result.Success(BuildResponse(user));
    }

    private AuthResponse BuildResponse(User user)
    {
        var (token, expiresAt) = tokenService.GenerateToken(user);
        return new AuthResponse(user.Id, user.Email, user.FirstName, user.LastName, user.Role.ToString(), token, expiresAt);
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
