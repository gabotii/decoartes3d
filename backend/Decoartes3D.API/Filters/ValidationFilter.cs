using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Decoartes3D.API.Filters;

/// <summary>
/// Ejecuta el IValidator&lt;T&gt; registrado para cada argumento de la acción y
/// devuelve un 400 ValidationProblemDetails con los errores por campo.
/// </summary>
public class ValidationFilter(IServiceProvider serviceProvider) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var errors = new Dictionary<string, string[]>();

        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null)
                continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            if (serviceProvider.GetService(validatorType) is not IValidator validator)
                continue;

            var result = await validator.ValidateAsync(
                new ValidationContext<object>(argument),
                context.HttpContext.RequestAborted);

            foreach (var group in result.Errors.GroupBy(e => ToCamelCase(e.PropertyName)))
                errors[group.Key] = group.Select(e => e.ErrorMessage).Distinct().ToArray();
        }

        if (errors.Count > 0)
        {
            context.Result = new BadRequestObjectResult(new ValidationProblemDetails(errors)
            {
                Title = "Hay errores de validación",
                Status = StatusCodes.Status400BadRequest
            });
            return;
        }

        await next();
    }

    // "Items[0].Quantity" → "items[0].quantity", igual que los nombres JSON que envía el frontend.
    private static string ToCamelCase(string propertyPath) =>
        string.Join('.', propertyPath.Split('.').Select(p => p.Length == 0 ? p : char.ToLowerInvariant(p[0]) + p[1..]));
}
