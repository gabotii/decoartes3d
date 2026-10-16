namespace Decoartes3D.Domain.Common;

public class Result
{
    protected Result(bool isSuccess, string? error, ErrorType errorType)
    {
        IsSuccess = isSuccess;
        Error = error;
        ErrorType = errorType;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;
    public string? Error { get; }
    public ErrorType ErrorType { get; }

    public static Result Success() => new(true, null, ErrorType.None);
    public static Result Failure(string error, ErrorType errorType = ErrorType.Validation) => new(false, error, errorType);
    public static Result NotFound(string error) => Failure(error, ErrorType.NotFound);
    public static Result Conflict(string error) => Failure(error, ErrorType.Conflict);

    public static Result<T> Success<T>(T value) => new(value, true, null, ErrorType.None);
    public static Result<T> Failure<T>(string error, ErrorType errorType = ErrorType.Validation) => new(default, false, error, errorType);
    public static Result<T> NotFound<T>(string error) => Failure<T>(error, ErrorType.NotFound);
    public static Result<T> Conflict<T>(string error) => Failure<T>(error, ErrorType.Conflict);
    public static Result<T> Unauthorized<T>(string error) => Failure<T>(error, ErrorType.Unauthorized);
}

public class Result<T> : Result
{
    private readonly T? _value;

    internal Result(T? value, bool isSuccess, string? error, ErrorType errorType) : base(isSuccess, error, errorType)
    {
        _value = value;
    }

    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Cannot access value of a failed result.");
}
