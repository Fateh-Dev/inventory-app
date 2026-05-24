using System;

namespace Modules.Stock.Application.DTOs;

public class WarehouseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Street { get; set; }
    public string? City { get; set; }
    public string? Wilaya { get; set; }
    public string? PostalCode { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public string? ResponsiblePerson { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
