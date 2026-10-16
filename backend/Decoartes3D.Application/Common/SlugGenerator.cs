using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Decoartes3D.Application.Common;

public static partial class SlugGenerator
{
    private const int MaxLength = 200;

    /// <summary>
    /// "Jarrón Geométrico Ñandú" → "jarron-geometrico-nandu"
    /// </summary>
    public static string Generate(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        var normalized = text.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                builder.Append(c);
        }

        var slug = NonAlphanumeric().Replace(builder.ToString().Normalize(NormalizationForm.FormC), "-").Trim('-');
        return slug.Length <= MaxLength ? slug : slug[..MaxLength].TrimEnd('-');
    }

    /// <summary>
    /// Añade sufijos -2, -3... hasta encontrar un slug libre.
    /// </summary>
    public static async Task<string> GenerateUniqueAsync(string text, Func<string, Task<bool>> exists)
    {
        var baseSlug = Generate(text);
        var slug = baseSlug;
        var suffix = 2;
        while (await exists(slug))
            slug = $"{baseSlug}-{suffix++}";
        return slug;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphanumeric();
}
