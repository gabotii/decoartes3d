using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Products;
using Decoartes3D.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Decoartes3D.API.Controllers;

[Route("api/products")]
public class ProductsController(IProductService productService) : ApiControllerBase
{
    /// <summary>
    /// Catálogo paginado con filtros. Para usuarios no administradores se fuerza IsActive = true.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<PagedResult<ProductSummaryResponse>>(StatusCodes.Status200OK)]
    public async Task<PagedResult<ProductSummaryResponse>> GetPaged([FromQuery] ProductQueryRequest query, CancellationToken cancellationToken)
    {
        if (!IsAdmin)
            query = query with { IsActive = true };
        return await productService.GetPagedAsync(query, cancellationToken);
    }

    [HttpGet("featured")]
    public async Task<IEnumerable<ProductSummaryResponse>> GetFeatured([FromQuery] int count = 8, CancellationToken cancellationToken = default) =>
        await productService.GetFeaturedAsync(count, cancellationToken);

    [HttpGet("{id:int}")]
    [ProducesResponseType<ProductDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDetailResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await productService.GetByIdAsync(id, cancellationToken);
        if (result.IsSuccess && !result.Value.IsActive && !IsAdmin)
            return NotFound();
        return FromResult(result);
    }

    [HttpGet("slug/{slug}")]
    [ProducesResponseType<ProductDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDetailResponse>> GetBySlug(string slug, CancellationToken cancellationToken) =>
        FromResult(await productService.GetBySlugAsync(slug, cancellationToken));

    [HttpPost]
    [Authorize(Roles = AppRoles.Admin)]
    [ProducesResponseType<ProductDetailResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDetailResponse>> Create(CreateProductRequest request, CancellationToken cancellationToken)
    {
        var result = await productService.CreateAsync(request, cancellationToken);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value)
            : Failure(result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    public async Task<ActionResult<ProductDetailResponse>> Update(int id, UpdateProductRequest request, CancellationToken cancellationToken) =>
        FromResult(await productService.UpdateAsync(id, request, cancellationToken));

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken) =>
        FromResult(await productService.DeleteAsync(id, cancellationToken));
}
