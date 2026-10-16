namespace Decoartes3D.Application.DTOs.Categories;

public record UpdateCategoryRequest(
    string Name,
    string? Description,
    string? ImageUrl,
    bool IsActive,
    int SortOrder
);
