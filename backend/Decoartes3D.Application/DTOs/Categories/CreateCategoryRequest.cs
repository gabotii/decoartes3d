namespace Decoartes3D.Application.DTOs.Categories;

public record CreateCategoryRequest(
    string Name,
    string? Description,
    string? ImageUrl,
    bool IsActive = true,
    int SortOrder = 0
);
