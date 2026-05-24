namespace Modules.Stock.Domain.Enums;

public enum StockMovementType
{
    Reception,     // incoming from supplier
    Issue,         // outgoing to department
    Transfer,      // between warehouses
    Return,        // returned from department
    Adjustment,    // manual correction (inventory count)
    Disposal       // expired / damaged write-off
}
