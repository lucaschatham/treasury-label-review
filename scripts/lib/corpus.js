// Synthetic ground truth is independent of the production comparison code.
export const WARNING =
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";
export const FONTS = [
  {
    family: "Helvetica",
    regular: "Helvetica",
    bold: "Helvetica-Bold",
    split: "development",
  },
  {
    family: "Times",
    regular: "Times-Roman",
    bold: "Times-Bold",
    split: "development",
  },
  {
    family: "Courier",
    regular: "Courier",
    bold: "Courier-Bold",
    split: "development",
  },
  {
    family: "Palatino",
    regular: "Palatino-Roman",
    bold: "Palatino-Bold",
    split: "holdout",
  },
  {
    family: "Century",
    regular: "NewCenturySchlbk-Roman",
    bold: "NewCenturySchlbk-Bold",
    split: "holdout",
  },
];
const BRANDS = [
  "OLD TOM DISTILLERY",
  "CEDAR RIDGE",
  "HARBOR LIGHT",
  "SILVER FIELD",
  "STONE’S THROW",
  "COPPER VALLEY",
  "NORTH ORCHARD",
  "RIVER BEND",
  "GOLDEN COAST",
  "MAPLE GROVE",
];
const variants = [
  "valid",
  "brand",
  "abv",
  "volume",
  "warning-word",
  "warning-case",
  "warning-weight",
  "missing-warning",
  "blur",
  "glare",
];

export function buildCorpus() {
  const labels = [];
  for (const [category, beverage] of ["spirits", "wine", "beer"].entries()) {
    for (let index = 0; index < 10; index++) {
      const design = `${beverage}-${String(index + 1).padStart(2, "0")}`;
      const application = {
        brand: BRANDS[index],
        type: [
          "Kentucky Straight Bourbon Whiskey",
          "Cabernet Sauvignon",
          "India Pale Ale",
        ][category],
        abv: ["45", "13.5", "6"][category],
        volume: category === 2 ? "12 fl oz" : "750 mL",
        producer:
          index === 0 && category === 0
            ? "Old Tom Distillery, Bardstown, KY"
            : `${BRANDS[index]}, ${index % 2 ? "Bordeaux, France" : "Portland, OR"}`,
        imported: index % 2 === 1,
        country: index % 2 ? "France" : "",
      };
      for (const variant of variants) {
        const observed = { ...application };
        if (variant === "brand") observed.brand = "DIFFERENT BRAND";
        if (variant === "abv")
          observed.abv = String(Number(application.abv) - 1);
        if (variant === "volume")
          observed.volume = category === 2 ? "16 fl oz" : "700 mL";
        let warning = WARNING;
        if (variant === "warning-word")
          warning = warning.replace("should not drink", "may drink");
        if (variant === "warning-case")
          warning = warning.replace(
            "GOVERNMENT WARNING:",
            "Government Warning:",
          );
        if (variant === "missing-warning") warning = "";
        labels.push({
          id: `${design}-${variant}`,
          design,
          split: index < 5 ? "development" : "holdout",
          beverage,
          variant,
          application,
          observed,
          warning,
          headingBold: variant !== "warning-weight",
          layout: index % 3,
          multilineBrand: index % 3 === 1,
          alcoholStyle: index % 3,
          quality: ["blur", "glare"].includes(variant) ? "difficult" : "clear",
          expectedDefect: ["valid", "blur", "glare"].includes(variant)
            ? null
            : variant,
          provenance:
            "Synthetic fixture authored for this project; no commercial artwork or personal data.",
        });
      }
    }
  }
  const typography = FONTS.flatMap((font) =>
    [24, 32, 40, 48].flatMap((size) =>
      [false, true].map((bold) => ({
        id: `${font.family.toLowerCase()}-${size}-${bold ? "bold" : "regular"}`,
        family: font.family,
        font: bold ? font.bold : font.regular,
        bodyFont: font.regular,
        size,
        expected: bold ? "bold" : "not_bold",
        split: font.split,
        provenance:
          "Synthetic warning crop with declared font face; no commercial artwork.",
      })),
    ),
  );
  return { version: 1, labels, typography };
}
