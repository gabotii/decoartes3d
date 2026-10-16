using Decoartes3D.Domain.Entities;

namespace Decoartes3D.Application.Interfaces;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) GenerateToken(User user);
}
