import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CRM за сервиз на кафемашини",
    short_name: "Сервиз CRM",
    description: "Вътрешна CRM система за приемане и проследяване на сервизни поръчки.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef4f0",
    theme_color: "#23443f",
    lang: "bg",
  };
}
