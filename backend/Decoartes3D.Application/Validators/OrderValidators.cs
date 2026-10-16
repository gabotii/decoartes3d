using Decoartes3D.Application.DTOs.Orders;
using FluentValidation;

namespace Decoartes3D.Application.Validators;

public class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public const int MaxItems = 50;
    public const int MaxQuantityPerItem = 100;

    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.ShippingFirstName).NotEmpty().WithMessage("El nombre es obligatorio.").MaximumLength(100);
        RuleFor(x => x.ShippingLastName).NotEmpty().WithMessage("Los apellidos son obligatorios.").MaximumLength(100);
        RuleFor(x => x.ShippingEmail)
            .NotEmpty().WithMessage("El email es obligatorio.")
            .EmailAddress().WithMessage("El email no es válido.")
            .MaximumLength(256);
        RuleFor(x => x.ShippingPhone).MaximumLength(30);
        RuleFor(x => x.ShippingAddress).NotEmpty().WithMessage("La dirección es obligatoria.").MaximumLength(300);
        RuleFor(x => x.ShippingCity).NotEmpty().WithMessage("La ciudad es obligatoria.").MaximumLength(100);
        RuleFor(x => x.ShippingState).NotEmpty().WithMessage("La provincia es obligatoria.").MaximumLength(100);
        RuleFor(x => x.ShippingPostalCode).NotEmpty().WithMessage("El código postal es obligatorio.").MaximumLength(20);
        RuleFor(x => x.ShippingCountry).NotEmpty().WithMessage("El país es obligatorio.").MaximumLength(100);
        RuleFor(x => x.Notes).MaximumLength(1000);

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("El pedido debe contener al menos un producto.")
            .Must(items => items.Count() <= MaxItems).WithMessage($"Un pedido admite como máximo {MaxItems} líneas.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).GreaterThan(0);
            item.RuleFor(i => i.Quantity)
                .InclusiveBetween(1, MaxQuantityPerItem)
                .WithMessage($"La cantidad debe estar entre 1 y {MaxQuantityPerItem}.");
        });
    }
}

public class UpdateOrderStatusRequestValidator : AbstractValidator<UpdateOrderStatusRequest>
{
    public UpdateOrderStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum().WithMessage("Estado de pedido no válido.");
    }
}
