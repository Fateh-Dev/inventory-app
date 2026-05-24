using SharedKernel;

namespace Modules.Stock.Domain.Entities;

public class Department : AggregateRoot
{
    public string Name { get; private set; }
    public string Code { get; private set; }
    public bool IsActive { get; private set; }

    private Department() { }

    public Department(string name, string code)
    {
        Id = Guid.NewGuid();
        Name = name;
        Code = code;
        IsActive = true;
    }

    public static Department Create(string name, string code)
    {
        return new Department(name, code);
    }

    public void Update(string name, string code)
    {
        Name = name;
        Code = code;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
