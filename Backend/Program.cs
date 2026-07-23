using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient("ml", c => c.BaseAddress = new Uri("http://127.0.0.1:8000"));

builder.Services.AddSingleton<IPartRepository, CsvPartRepository>();

var app = builder.Build();

app.MapGet("/", () => "MRO Project Home Page");

app.MapGet("/api/parts", (IPartRepository repo) => repo.GetAllParts());

app.MapGet("/api/orders", (IPartRepository repo) => repo.GetAllOrders());

app.MapGet("/api/parts/{id}", (string id, IPartRepository repo) =>
{
    var part = repo.GetById(id);
    return part is null ? Results.NotFound() : Results.Ok(part);
});

app.MapGet("/api/orders/{id}", (IPartRepository repo, string id) =>
{
   var order = repo.GetSupplierInfo(id);
   return order is null ? Results.NotFound() : Results.Ok(order); 
});

app.MapGet("/api/parts/{id}/prediction", async (string id, IPartRepository repo, IHttpClientFactory f) =>
{
    var part = repo.GetById(id);
    if (part is null) return Results.NotFound();

    var ml = f.CreateClient("ml");

    var answer = await ml.PostAsJsonAsync("/predict/stock", new {
        category = part.Category,
        criticality = part.Criticality,
        stock_quantity = part.StockQuantity,
        avg_daily_usage = part.AvgDailyUsage,
        usage_trend_pct = part.UsageTrendPct
    });
    var stock = await answer.Content.ReadFromJsonAsync<StockEstimation>();

    return Results.Ok(stock);
});

app.MapGet("/api/orders/{id}/prediction", async (string id, IPartRepository repo, IHttpClientFactory f) =>
{
    var part = repo.GetSupplierInfo(id);
    if(part is null) return Results.NotFound();

    var ml = f.CreateClient("ml");

    var answer = await ml.PostAsJsonAsync("/predict/leadtime", new
    {
        category = part.Category,
        criticality = part.Criticality,
        supplier_name = part.SupplierName,
        supplier_country = part.SupplierCountry,
        shipping_method = part.ShippingMethod,
        supplier_reliability_score = part.SupplierReliabilityScore,
        promised_delivery_days = part.PromisedDeliveryDays
    });
    var leadTime = await answer.Content.ReadFromJsonAsync<LeadTimeEstimation>();

    return Results.Ok(leadTime);
});

app.Run();

record Part(
    string ProductId,
    string ProductName,
    string Category,
    string Criticality,
    int StockQuantity,
    double AvgDailyUsage,
    double UsageTrendPct
);

record SupplierOrder(
    string ProductId,
    string ProductName,
    string Category,
    string Criticality,
    string SupplierName,
    string SupplierCountry,
    string ShippingMethod,
    double SupplierReliabilityScore,
    int PromisedDeliveryDays
);

record StockEstimation(
    [property: JsonPropertyName("median_day")] double MedianDay,
    [property: JsonPropertyName("earliest_day")] double EarliestDay,
    [property: JsonPropertyName("latest_day")] double LatestDay
);

record LeadTimeEstimation(
    [property: JsonPropertyName("lead_time")] double LeadTime,
    [property: JsonPropertyName("promised_delivery_days")] double PromisedDeliveryDays,
    [property: JsonPropertyName("delay_warning")] bool DelayWarning
);

interface IPartRepository
{
    List<Part> GetAllParts();

    List<SupplierOrder> GetAllOrders();
    Part? GetById(string id);
    SupplierOrder? GetSupplierInfo(string productId);
}

class CsvPartRepository : IPartRepository
{
    private readonly List<Part> _parts;

    private readonly List<SupplierOrder> _orders;
    
    public CsvPartRepository()
    {
        _parts = File.ReadAllLines("Data/model1_stock_depletion.csv")
            .Skip(1)
            .Select(row => row.Split(','))
            .Select(k => new Part(
                k[0], k[1], k[2], k[3],
                int.Parse(k[5]),
                double.Parse(k[6], System.Globalization.CultureInfo.InvariantCulture),
                double.Parse(k[7], System.Globalization.CultureInfo.InvariantCulture)
            ))
            .GroupBy(p => p.ProductId)
            .Select(g => g.Last())
            .ToList();

        _orders = File.ReadAllLines("Data/model2_supplier_leadtime.csv")
        .Skip(1)
        .Select(row => row.Split(','))
        .Select(k => new SupplierOrder(
            k[0], k[1], k[2], k[3], k[4], k[5], k[6],
            double.Parse(k[7], System.Globalization.CultureInfo.InvariantCulture),
            int.Parse(k[8])
        ))
        .ToList();
    }
    

    public List<Part> GetAllParts() => _parts;

    public List<SupplierOrder> GetAllOrders() => _orders;

    public Part? GetById(string id) => _parts.FirstOrDefault(p => p.ProductId == id);

    public SupplierOrder? GetSupplierInfo(string productId) =>
    _orders.Where(o => o.ProductId == productId)
           .OrderByDescending(o => o.SupplierReliabilityScore)
           .FirstOrDefault();
           
}