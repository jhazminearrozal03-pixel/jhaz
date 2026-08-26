import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface PayslipData {
  employee: {
    employeeId: string;
    name: string;
    department: string;
    position: string;
  };
  payPeriodStart: string;
  payPeriodEnd: string;
  grossPay: number;
  sssDeduction: number;
  philhealthDeduction: number;
  pagibigDeduction: number;
  taxDeduction: number;
  totalDeductions: number;
  netPay: number;
  status: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#171717",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderBottom: "2 solid #171717",
    paddingBottom: 12,
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  payslipTitle: {
    fontSize: 12,
    color: "#525252",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    textTransform: "uppercase",
    color: "#525252",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    color: "#525252",
  },
  value: {
    fontFamily: "Helvetica-Bold",
  },
  table: {
    marginTop: 6,
    borderTop: "1 solid #d4d4d4",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottom: "1 solid #e5e5e5",
  },
  tableLabel: {
    color: "#171717",
  },
  tableValue: {
    fontFamily: "Helvetica-Bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTop: "2 solid #171717",
  },
  totalLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  totalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  netPayBox: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netPayLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  netPayValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    marginTop: 32,
    fontSize: 8,
    color: "#a3a3a3",
    textAlign: "center",
  },
});

function formatPHP(amount: number) {
  return `PHP ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PayslipDocument({ data }: { data: PayslipData }) {
  return (
    <Document title={`Payslip - ${data.employee.name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Payroll Assistant</Text>
            <Text style={styles.payslipTitle}>Employee Payslip</Text>
          </View>
          <View>
            <Text style={styles.payslipTitle}>
              {formatDate(data.payPeriodStart)} &ndash; {formatDate(data.payPeriodEnd)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Employee ID</Text>
            <Text style={styles.value}>{data.employee.employeeId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{data.employee.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.value}>{data.employee.department}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Position</Text>
            <Text style={styles.value}>{data.employee.position}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Gross Pay</Text>
              <Text style={styles.tableValue}>{formatPHP(data.grossPay)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deductions</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>SSS Contribution</Text>
              <Text style={styles.tableValue}>{formatPHP(data.sssDeduction)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>PhilHealth Contribution</Text>
              <Text style={styles.tableValue}>{formatPHP(data.philhealthDeduction)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Pag-IBIG Contribution</Text>
              <Text style={styles.tableValue}>{formatPHP(data.pagibigDeduction)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Withholding Tax</Text>
              <Text style={styles.tableValue}>{formatPHP(data.taxDeduction)}</Text>
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Deductions</Text>
            <Text style={styles.totalValue}>{formatPHP(data.totalDeductions)}</Text>
          </View>
        </View>

        <View style={styles.netPayBox}>
          <Text style={styles.netPayLabel}>Net Pay</Text>
          <Text style={styles.netPayValue}>{formatPHP(data.netPay)}</Text>
        </View>

        <Text style={styles.footer}>
          This is a system-generated payslip. Status: {data.status}.
        </Text>
      </Page>
    </Document>
  );
}
