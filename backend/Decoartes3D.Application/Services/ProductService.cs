using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Products;
using Decoartes3D.Application.Interfaces;
using Decoartes3D.Application.Mappings;
using Decoartes3D.Domain.Common;
using Decoartes3D.Domain.Entities;
using Decoartes3D.Domain.Interfaces;
using Decoartes3D.Domain.Interfaces.Repositories;

namespace Decoartes3D.Application.Services;

public class ProductService(
    IProductRepository productRepository,
    ICategoryRepository categoryRepository,
    IMaterialRepository materialRepository,
    IOrderRepository orderRepository,
    IUnitOfWork unitOfWork) : IProductService
{
    private const string NotFoundMessage = "Producto no encontrado.";
    private const int MaxFeatured = 50;

    public async Task<PagedResult<ProductSummaryResponse>> GetPagedAsync(ProductQueryRequest query, CancellationToken cancellationToken = default)
    {
        var (pageNumber, pageSize) = Pagination.Normalize(query.PageNumber, query.PageSize);

        var (items, totalCount) = await productRepository.GetPagedAsync(
            pageNumber,
            pageSize,
            query.CategoryId,
            query.MaterialId,
            string.IsNullOrWhiteSpace(query.SearchTerm) ? null : query.SearchTerm.Trim(),
            query.IsActive,
            query.IsFeatured,
            cancellationToken);

        return items.ToPagedResult(totalCount, pageNumber, pageSize, p => p.ToSummaryResponse());
    }

    public async Task<IEnumerable<ProductSummaryResponse>> GetFeaturedAsync(int count = 8, CancellationToken cancellationToken = default)
    {
        var products = await productRepository.GetFeaturedAsync(Math.Clamp(count, 1, MaxFeatured), cancellationToken);
        return products.Select(p => p.ToSummaryResponse()).ToList();
    }

    public async Task<Result<ProductDetailResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetWithDetailsAsync(id, cancellationToken);
        return product is null
            ? Result.NotFound<ProductDetailResponse>(NotFoundMessage)
            : Result.Success(product.ToDetailResponse());
    }

    /// <summary>
    /// Búsqueda pública (URL del catálogo): los productos inactivos no se exponen.
    /// </summary>
    public async Task<Result<ProductDetailResponse>> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetBySlugAsync(slug.Trim().ToLowerInvariant(), cancellationToken);
        return product is null || !product.IsActive
            ? Result.NotFound<ProductDetailResponse>(NotFoundMessage)
            : Result.Success(product.ToDetailResponse());
    }

    public async Task<Result<ProductDetailResponse>> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        var referencesError = await ValidateReferencesAsync(request.CategoryId, request.MaterialId, cancellationToken);
        if (referencesError is not null)
            return Result.Failure<ProductDetailResponse>(referencesError);

        var name = request.Name.Trim();
        var product = new Product
        {
            Name = name,
            Slug = await SlugGenerator.GenerateUniqueAsync(name, s => productRepository.SlugExistsAsync(s, null, cancellationToken)),
            Description = request.Description?.Trim(),
            ShortDescription = request.ShortDescription?.Trim(),
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            MainImageUrl = request.MainImageUrl?.Trim(),
            Width = request.Width,
            Height = request.Height,
            Depth = request.Depth,
            WeightGrams = request.WeightGrams,
            IsActive = request.IsActive,
            IsFeatured = request.IsFeatured,
            SortOrder = request.SortOrder,
            CategoryId = request.CategoryId,
            MaterialId = request.MaterialId
        };

        await productRepository.AddAsync(product, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(product.Id, cancellationToken);
    }

    public async Task<Result<ProductDetailResponse>> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetByIdAsync(id, cancellationToken);
        if (product is null)
            return Result.NotFound<ProductDetailResponse>(NotFoundMessage);

        var referencesError = await ValidateReferencesAsync(request.CategoryId, request.MaterialId, cancellationToken);
        if (referencesError is not null)
            return Result.Failure<ProductDetailResponse>(referencesError);

        var name = request.Name.Trim();
        if (!string.Equals(product.Name, name, StringComparison.Ordinal))
            product.Slug = await SlugGenerator.GenerateUniqueAsync(name, s => productRepository.SlugExistsAsync(s, id, cancellationToken));

        product.Name = name;
        product.Description = request.Description?.Trim();
        product.ShortDescription = request.ShortDescription?.Trim();
        product.Price = request.Price;
        product.StockQuantity = request.StockQuantity;
        product.MainImageUrl = request.MainImageUrl?.Trim();
        product.Width = request.Width;
        product.Height = request.Height;
        product.Depth = request.Depth;
        product.WeightGrams = request.WeightGrams;
        product.IsActive = request.IsActive;
        product.IsFeatured = request.IsFeatured;
        product.SortOrder = request.SortOrder;
        product.CategoryId = request.CategoryId;
        product.MaterialId = request.MaterialId;

        await productRepository.UpdateAsync(product, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<Result> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetByIdAsync(id, cancellationToken);
        if (product is null)
            return Result.NotFound(NotFoundMessage);

        // Los pedidos conservan el historial: un producto ya vendido solo puede desactivarse.
        if (await orderRepository.ExistsAsync(o => o.Items.Any(i => i.ProductId == id), cancellationToken))
            return Result.Conflict("El producto tiene pedidos asociados y no puede eliminarse. Desactívalo en su lugar.");

        await productRepository.DeleteAsync(product, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }

    private async Task<string?> ValidateReferencesAsync(int categoryId, int? materialId, CancellationToken cancellationToken)
    {
        if (!await categoryRepository.ExistsAsync(c => c.Id == categoryId, cancellationToken))
            return "La categoría indicada no existe.";

        if (materialId.HasValue && !await materialRepository.ExistsAsync(m => m.Id == materialId.Value, cancellationToken))
            return "El material indicado no existe.";

        return null;
    }
}
