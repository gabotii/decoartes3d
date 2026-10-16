namespace Decoartes3D.Application.DTOs.Materials;

public record CreateMaterialRequest(
    string Name,
    string? Description,
    string? ColorHex,
    bool IsActive = true
);
