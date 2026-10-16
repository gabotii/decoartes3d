using Decoartes3D.Application.Common;
using Decoartes3D.Domain.Entities;
using Decoartes3D.Domain.Enums;

namespace Decoartes3D.Tests.Unit;

public class SlugGeneratorTests
{
    [Theory]
    [InlineData("Jarrón Geométrico", "jarron-geometrico")]
    [InlineData("  Lámpara   Luna!! ", "lampara-luna")]
    [InlineData("Ñandú & Cigüeña", "nandu-ciguena")]
    [InlineData("Set 3D (x6)", "set-3d-x6")]
    [InlineData("---", "")]
    public void Generate_produces_url_safe_slugs(string input, string expected)
    {
        Assert.Equal(expected, SlugGenerator.Generate(input));
    }

    [Fact]
    public async Task GenerateUnique_appends_the_first_free_suffix()
    {
        var taken = new HashSet<string> { "jarron", "jarron-2" };

        var slug = await SlugGenerator.GenerateUniqueAsync("Jarrón", s => Task.FromResult(taken.Contains(s)));

        Assert.Equal("jarron-3", slug);
    }
}

public class OrderTransitionTests
{
    [Theory]
    [InlineData(OrderStatus.Pending, OrderStatus.Confirmed, true)]
    [InlineData(OrderStatus.Pending, OrderStatus.Cancelled, true)]
    [InlineData(OrderStatus.Pending, OrderStatus.Shipped, false)]
    [InlineData(OrderStatus.Confirmed, OrderStatus.InProduction, true)]
    [InlineData(OrderStatus.InProduction, OrderStatus.Shipped, true)]
    [InlineData(OrderStatus.Shipped, OrderStatus.Delivered, true)]
    [InlineData(OrderStatus.Shipped, OrderStatus.Cancelled, false)]
    [InlineData(OrderStatus.Delivered, OrderStatus.Cancelled, false)]
    [InlineData(OrderStatus.Cancelled, OrderStatus.Pending, false)]
    public void CanTransitionTo_follows_the_order_lifecycle(OrderStatus from, OrderStatus to, bool expected)
    {
        var order = new Order { Status = from };

        Assert.Equal(expected, order.CanTransitionTo(to));
    }
}
