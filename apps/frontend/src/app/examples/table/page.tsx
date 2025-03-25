import { Table, Tbody, Td, Tfoot, Th, Thead, Tr } from '@/components/table';

const COLUMNS = 10;
const ROWS = 10;

export default function TableExamplePage() {
  return (
    <div className="p-4">
      <div className="w-full grid grid-cols-1 overflow-x-auto border">
        <Table>
          <Thead>
            <Tr>
              {Array.from({ length: COLUMNS }).map((_, i) => (
                <Th key={i}>Column {i + 1}</Th>
              ))}
            </Tr>
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
            <Tr>
              {Array.from({ length: COLUMNS }).map((_, i) => (
                <Th key={i}>Column {i + 1}</Th>
              ))}
            </Tr>
          </Tfoot>
        </Table>
      </div>
    </div>
  );
}
