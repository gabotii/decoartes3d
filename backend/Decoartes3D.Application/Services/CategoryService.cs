using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Categories;
using Decoartes3D.Application.Interfaces;
using Decoartes3D.Application.Mappings;
using Decoartes3D.Domain.Common;
using Decoartes3D.Domain.Entities;
using Decoartes3D.Domain.Interfaces;
using Decoartes3D.Domain.Interfaces.Repositories;

namespace Decoartes3D.Application.Services;

public class CategoryService(
    ICategoryRepository categoryRepository,
    IProductRepository productRepository,
    IUnitOfWork unitOfWork) : ICategoryService
{
    private const string NotFoundMessage = "Categoría no encontrada.";

    public async Task<IEnumerable<CategoryResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var categories = await categoryRepository.GetAllAsync(cancellationToken);
        return categories.OrderBy(c => c.SortOrder).ThenBy(c => c.Name).Select(c => c.ToResponse()).ToList();
    }

    public async Task<IEnumerable<CategoryResponse>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        var categories = await categoryRepository.GetActiveAsync(cancellationToken);
        return categories.Select(c => c.ToResponse()).ToList();
    }

    public async Task<Result<CategoryResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken);
        return category is null
            ? Result.NotFound<CategoryResponse>(NotFoundMessage)
            : Result.Success(category.ToResponse());
    }

    public async Task<Result<CategoryResponse>> CreateAsync(CreateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        if (await NameExistsAsync(name, null, cancellationToken))
            return Result.Conflict<CategoryResponse>($"Ya existe una categoría llamada '{name}'.");

        var category = new Category
        {
            Name = name,
            Slug = await SlugGenerator.GenerateUniqueAsync(name, s => categoryRepository.SlugExistsAsync(s, null, cancellationToken)),
            Description = request.Description?.Trim(),
            ImageUrl = request.ImageUrl?.Trim(),
            IsActive = request.IsActive,
            SortOrder = request.SortOrder
        };

        await categoryRepository.AddAsync(category, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(category.ToResponse());
    }

    public async Task<Result<CategoryResponse>> UpdateAsync(int id, UpdateCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken);
        if (category is null)
            return Result.NotFound<CategoryResponse>(NotFoundMessage);

        var name = request.Name.Trim();
        if (await NameExistsAsync(name, id, cancellationToken))
            return Result.Conflict<CategoryResponse>($"Ya existe una categoría llamada '{name}'.");

        if (!string.Equals(category.Name, name, StringComparison.Ordinal))
            category.Slug = await SlugGenerator.GenerateUniqueAsync(name, s => categoryRepository.SlugExistsAsync(s, id, cancellationToken));

        category.Name = name;
        category.Description = request.Description?.Trim();
        category.ImageUrl = request.ImageUrl?.Trim();
        category.IsActive = request.IsActive;
        category.SortOrder = request.SortOrder;

        await categoryRepository.UpdateAsync(category, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(category.ToResponse());
    }

    public async Task<Result> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var category = await categoryRepository.GetByIdAsync(id, cancellationToken);
        if (category is null)
            return Result.NotFound(NotFoundMessage);

        if (await productRepository.ExistsAsync(p => p.CategoryId == id, cancellationToken))
            return Result.Conflict("No se puede eliminar una categoría que tiene productos. Desactívala o mueve sus productos.");

        await categoryRepository.DeleteAsync(category, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private Task<bool> NameExistsAsync(string name, int? excludeId, CancellationToken cancellationToken) =>
        categoryRepository.ExistsAsync(c => c.Name == name && (excludeId == null || c.Id != excludeId), cancellationToken);
}
