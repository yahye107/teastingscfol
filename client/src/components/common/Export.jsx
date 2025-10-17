import * as XLSX from "xlsx"; // for Excel
import { saveAs } from "file-saver"; // to trigger downloads
import { Document, Packer, Paragraph, Table, TableRow, TableCell } from "docx"; // for Word
import { toast } from "sonner";

const exportData = (type, data, filename = "export") => {
  if (!data || data.rows.length === 0) {
    toast("No data to export");
    return;
  }

  const { headers, rows } = data;

  if (type === "csv") {
    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((f) => `"${f}"`).join(",") + "\n";
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${filename}.csv`);
  }

  if (type === "excel") {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  if (type === "word") {
    const tableRows = [
      new TableRow({
        children: headers.map(
          (header) =>
            new TableCell({
              children: [new Paragraph({ text: header })],
            })
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ text: cell.toString() })],
                })
            ),
          })
      ),
    ];

    const doc = new Document({
      sections: [
        {
          children: [new Table({ rows: tableRows })],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${filename}.docx`);
    });
  }
};

export default exportData;
