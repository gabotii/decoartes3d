namespace Decoartes3D.Application.DTOs.Categories;

public record CategoryResponse(
    int Id,
    string Name,
    string Slug,
    string? Description,
    string? ImageUrl,
    bool IsActive,
    int SortOrder,
    int ProductCount,
    DateTime CreatedAt
);
