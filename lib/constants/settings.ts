const settings = {
    meta: {
        name: "KATACHI Studio",
        description: "KATACHI Studio is a studio that makes products for the home.",
        url: "https://katachi.studio",
        logo: "/logo.png",
        icon: "/icon.png",
        theme: "light",
        locale: "en-US",
        currency: "USD",
        timezone: "UTC",
    },

    active: true, // if false, the website will be disabled
    
    payment: {
        card: false, // stripe if true, other secured method/api if false
        paypal: true, // if false, the paypal payment will be disabled
        bank_transfer: false, // if false, the bank transfer payment will be disabled
    },

    // Product defaults
    defaults: {
        taxPercentage: 0.00, // Default tax percentage for products (e.g., 19% VAT)
        shippingPrice: 0.00, // Default shipping price (0.00 for free shipping)
        currency: "USD", // € for Euro, $ for USD, etc. Default currency for products
    },

    // Display settings
    display: {
        currencyLocale: "en-US", // Locale for currency formatting (e.g., "de-DE" for European format)
        currencySymbol: "$", // € for Euro, $ for USD, etc. Currency symbol to display
    },

    // Country-specific tax rates
    taxRates: {
        // European Union VAT rates
        AT: 20.00, // Austria
        BE: 21.00, // Belgium
        BG: 20.00, // Bulgaria
        HR: 25.00, // Croatia
        CM: 19.00, // cameroon
        CY: 19.00, // Cyprus
        CZ: 21.00, // Czech Republic
        DK: 25.00, // Denmark
        EE: 20.00, // Estonia
        FI: 24.00, // Finland
        FR: 20.00, // France
        DE: 19.00, // Germany
        GR: 24.00, // Greece
        HU: 27.00, // Hungary
        IE: 23.00, // Ireland
        IT: 22.00, // Italy
        LV: 21.00, // Latvia
        LT: 21.00, // Lithuania
        LU: 17.00, // Luxembourg
        MT: 18.00, // Malta
        NL: 21.00, // Netherlands
        PL: 23.00, // Poland
        PT: 23.00, // Portugal
        RO: 19.00, // Romania
        SK: 20.00, // Slovakia
        SI: 22.00, // Slovenia
        ES: 21.00, // Spain
        SE: 25.00, // Sweden
        // Other countries
        US: 0.00,  // USA (sales tax varies by state)
        GB: 20.00, // United Kingdom
        CH: 7.70,  // Switzerland
        NO: 25.00, // Norway
        CA: 0.00,  // Canada (varies by province)
        AU: 10.00, // Australia (GST)
        NZ: 15.00, // New Zealand (GST)
        JP: 10.00, // Japan
    } as Record<string, number>,

    // Shipping methods (can be overridden by database values)
    shippingMethods: [
        {
            id: "standard",
            name: "Standard Shipping",
            description: "Delivery in 5-7 business days",
            price: 0.00,
            estimatedDays: "5-7",
            enabled: true,
            countries: ["BE", "NL", "FR", "DE", "LU", "GB", "US", "CA", "ES", "IT", "AT", "CH", "NO", "AU", "NZ", "JP"],
        },
        {
            id: "express",
            name: "Express Shipping",
            description: "Delivery in 2-3 business days",
            price: 15.00,
            estimatedDays: "2-3",
            enabled: true,
            countries: ["BE", "NL", "FR", "DE", "LU", "GB", "US", "CA", "ES", "IT", "AT", "CH", "NO", "AU", "NZ", "JP"],
        },
        {
            id: "overnight",
            name: "Overnight Shipping",
            description: "Next business day delivery",
            price: 30.00,
            estimatedDays: "1",
            enabled: true,
            countries: ["BE", "NL", "FR", "DE", "LU", "GB", "US", "CA", "ES", "IT", "AT", "CH", "NO", "AU", "NZ", "JP"],
        },
    ],

    locationAPI: {
        ipapi: true, // if false, the ipapi will be disabled and the ip will be fetched from any other api else from client (::ffff:192.168.1.141))
        ipinfo: true,
    },

    locationCookieProps: {
        name: "Location_analytic",
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    },
    locationCookieDuration: 1 * 24 * 60 * 60 * 1000, // 30 days
    clearLocationCookie: false, // if true, the location cookie will be cleared after the location is fetched


}

export default settings;