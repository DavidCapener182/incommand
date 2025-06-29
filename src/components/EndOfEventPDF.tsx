import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';

// Register a clean font (Inter or fallback)
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTcviYw.ttf' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTcviYw.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 12,
    padding: 32,
    backgroundColor: '#fff',
    color: '#222',
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
    color: '#1a237e',
  },
  section: {
    marginBottom: 18,
    paddingBottom: 8,
    borderBottom: '1 solid #eee',
  },
  label: {
    fontWeight: 700,
    color: '#1a237e',
    marginBottom: 2,
  },
  value: {
    marginBottom: 6,
  },
  table: {
    width: 'auto',
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'column',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#e3e7fa',
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 11,
    borderRight: '1 solid #d1d5db',
    borderBottom: '1 solid #d1d5db',
  },
  tableCellLast: {
    borderRight: 0,
  },
  signatureBox: {
    height: 50,
    border: '1 solid #bdbdbd',
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  fileName: {
    fontStyle: 'italic',
    color: '#616161',
    marginTop: 4,
  },
});

// Add or update the props type definition above the component
interface EndOfEventPDFProps {
  headOfSecurity: string;
  eventDate: string;
  eventName: string;
  staffBriefedTime: string;
  doorsOpenTime: string;
  supportActs: any[]; // Replace 'any' with a more specific type if known
  mainAct: string;
  showdownTime: string;
  venueClearTime: string;
  incidentSummary: string;
  logoUrl: string;
  logs: any[]; // Replace 'any' with a more specific type if known
  incidentReportFileName: string;
  signatureType: string;
  signatureScribble: string;
  // Add any other props as needed
}

const EndOfEventPDF = ({
  logoUrl = '/inCommand.png', // Use your public logo path or a remote URL
  headOfSecurity,
  eventDate,
  eventName,
  staffBriefedTime,
  doorsOpenTime,
  supportActs,
  mainAct,
  showdownTime,
  venueClearTime,
  incidentSummary,
  logs, // [{ type, time, details }]
  incidentReportFileName,
  signatureType,
  signatureScribble,
}: EndOfEventPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Logo and Title */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Image src={logoUrl} style={styles.logo} />
        <Text style={[styles.heading, { marginLeft: 16 }]}>End of Event Report</Text>
      </View>

      {/* Event Details */}
      <View style={styles.section}>
        <Text style={styles.label}>Head of Security</Text>
        <Text style={styles.value}>{headOfSecurity || '-'}</Text>

        <Text style={styles.label}>Date of Event</Text>
        <Text style={styles.value}>{eventDate || '-'}</Text>

        <Text style={styles.label}>Event Name</Text>
        <Text style={styles.value}>{eventName || '-'}</Text>

        <Text style={styles.label}>Staff Briefed & In Position</Text>
        <Text style={styles.value}>{staffBriefedTime || '-'}</Text>

        <Text style={styles.label}>Doors Open Time</Text>
        <Text style={styles.value}>{doorsOpenTime || '-'}</Text>

        <Text style={styles.label}>Support Act(s)</Text>
        <Text style={styles.value}>{supportActs || '-'}</Text>

        <Text style={styles.label}>Main Act</Text>
        <Text style={styles.value}>{mainAct || '-'}</Text>

        <Text style={styles.label}>Showdown Time</Text>
        <Text style={styles.value}>{showdownTime || '-'}</Text>

        <Text style={styles.label}>Venue Clear Time</Text>
        <Text style={styles.value}>{venueClearTime || '-'}</Text>
      </View>

      {/* Incident Summary */}
      <View style={styles.section}>
        <Text style={styles.label}>Incident Summary</Text>
        <Text style={styles.value}>{incidentSummary || '-'}</Text>
      </View>

      {/* All Logs Table */}
      <View style={styles.section}>
        <Text style={styles.label}>All Logs (excluding Attendance)</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Type</Text>
            <Text style={styles.tableCell}>Time</Text>
            <Text style={[styles.tableCell, styles.tableCellLast]}>Details</Text>
          </View>
          {/* Table Rows */}
          {logs && logs.length > 0 ? (
            logs.map((log: any, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  { backgroundColor: idx % 2 === 0 ? '#f5f7fa' : '#fff' },
                ]}
              >
                <Text style={styles.tableCell}>{log.type}</Text>
                <Text style={styles.tableCell}>{log.time}</Text>
                <Text style={[styles.tableCell, styles.tableCellLast]}>{log.details}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>-</Text>
              <Text style={styles.tableCell}>-</Text>
              <Text style={[styles.tableCell, styles.tableCellLast]}>No logs</Text>
            </View>
          )}
        </View>
      </View>

      {/* Incident Report File */}
      {incidentReportFileName && (
        <View style={styles.section}>
          <Text style={styles.label}>Incident Report File</Text>
          <Text style={styles.fileName}>{incidentReportFileName}</Text>
        </View>
      )}

      {/* Signatures */}
      <View style={styles.section}>
        <Text style={styles.label}>Signature (type)</Text>
        <View style={styles.signatureBox}>
          <Text style={{ margin: 12 }}>{signatureType || ' '}</Text>
        </View>
        <Text style={styles.label}>Signature (scribble)</Text>
        <View style={styles.signatureBox}>
          {/* If you have a base64 image for the scribble, you can use <Image src={signatureScribble} /> */}
          <Text style={{ margin: 12 }}>{signatureScribble || ' '}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default EndOfEventPDF;
