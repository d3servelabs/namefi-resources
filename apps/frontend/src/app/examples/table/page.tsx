import { Table, Tbody, Td, Tfoot, Th, Thead, Tr } from '@/components/table';

const COLUMNS = 5;
const ROWS = 25;

export default function TableExamplePage() {
  return (
    <div className="p-4">
      <Table>
        <Thead>
          {Array.from({ length: COLUMNS }).map((_, i) => (
            <Th key={i}>Column {i + 1}</Th>
          ))}
        </Thead>
        <Tbody>
          {Array.from({ length: ROWS }).map((_, rowIndex) => (
            <Tr key={rowIndex}>
              {Array.from({ length: COLUMNS }).map((_, colIndex) => (
                <Td key={colIndex}>
                  Row {rowIndex + 1}, Col {colIndex + 1}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
        <Tfoot>
          {Array.from({ length: COLUMNS }).map((_, i) => (
            <Th key={i}>Column {i + 1}</Th>
          ))}
        </Tfoot>
      </Table>
    </div>
  );
}
