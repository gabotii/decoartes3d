using Decoartes3D.Application.Common;
using Decoartes3D.Application.DTOs.Categories;
using Decoartes3D.Application.DTOs.Materials;
using Decoartes3D.Application.DTOs.Products;
using FluentValidation;

namespace Decoartes3D.Application.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("El nombre es obligatorio.").MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.ImageUrl).MaximumLength(500);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}

public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("El nombre es obligatorio.").MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.ImageUrl).MaximumLength(500);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}

public class CreateMaterialRequestValidator : AbstractValidator<CreateMaterialRequest>
{
    public CreateMaterialRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("El nombre es obligatorio.").MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(1000);
        RuleFor(x => x.ColorHex)
            .Matches("^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$")
            .When(x => !string.IsNullOrWhiteSpace(x.ColorHex))
            .WithMessage("El color debe tener formato hexadecimal, p. ej. #FF8800.");
    }
}

public abstract class ProductRequestValidator<T> : AbstractValidator<T> where T : IProductRequest
{
    protected ProductRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("El nombre es obligatorio.").MaximumLength(200);
        RuleFor(x => x.ShortDescription).MaximumLength(500);
        RuleFor(x => x.Description).MaximumLength(4000);
        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("El precio debe ser mayor que 0.")
            .PrecisionScale(10, 2, true).WithMessage("El precio admite como máximo 2 decimales.");
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0).WithMessage("El stock no puede ser negativo.");
        RuleFor(x => x.MainImageUrl).MaximumLength(500);
        RuleFor(x => x.Width).GreaterThan(0).When(x => x.Width.HasValue);
        RuleFor(x => x.Height).GreaterThan(0).When(x => x.Height.HasValue);
        RuleFor(x => x.Depth).GreaterThan(0).When(x => x.Depth.HasValue);
        RuleFor(x => x.WeightGrams).GreaterThan(0).When(x => x.WeightGrams.HasValue);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("La categoría es obligatoria.");
        RuleFor(x => x.MaterialId).GreaterThan(0).When(x => x.MaterialId.HasValue);
    }
}

public class CreateProductRequestValidator : ProductRequestValidator<CreateProductRequest>;

public class UpdateProductRequestValidator : ProductRequestValidator<UpdateProductRequest>;

public class ProductQueryRequestValidator : AbstractValidator<ProductQueryRequest>
{
    public ProductQueryRequestValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, Pagination.MaxPageSize);
        RuleFor(x => x.SearchTerm).MaximumLength(100);
    }
}
