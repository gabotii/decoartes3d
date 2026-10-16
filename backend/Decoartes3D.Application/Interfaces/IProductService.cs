using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Products;
using Decoartes3D.Domain.Common;

namespace Decoartes3D.Application.Interfaces;

public interface IProductService
{
    Task<PagedResult<ProductSummaryResponse>> GetPagedAsync(ProductQueryRequest query, CancellationToken cancellationToken = default);
    Task<IEnumerable<ProductSummaryResponse>> GetFeaturedAsync(int count = 8, CancellationToken cancellationToken = default);
    Task<Result<ProductDetailResponse>> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Result<ProductDetailResponse>> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<Result<ProductDetailResponse>> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default);
    Task<Result<ProductDetailResponse>> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
