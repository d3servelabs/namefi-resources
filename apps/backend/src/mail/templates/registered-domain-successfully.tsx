import { Button, Text } from '@react-email/components';
import { Code } from '../components/code';
import { NamefiEmailContainer } from '../components/namefi-email-container';
import * as styles from '../styles';
// biome-ignore lint/correctness/noUnusedImports: required for react-email
import React from 'react';
import { usePoweredByNamefiDomain } from '../components/powered-by-namefi-url-context';
import { buildTemplate } from '../components/build-template';
import { NamefiEmailLinks } from '../email-links';

export type RegisteredDomainSuccessfullyProps = {
  domainUnicodeName: string;
};
export const RegisteredDomainSuccessfully =
  buildTemplate<RegisteredDomainSuccessfullyProps>(
    (props) => {
      const { domainUnicodeName } = props;
      const poweredByNamefiDomain = usePoweredByNamefiDomain();

      return (
        <NamefiEmailContainer
          title={`[Namefi] Congratulations! ${domainUnicodeName} is Yours!`}
        >
          <Text style={styles.paragraph}>
            You did it! Your new domain is officially registered and ready to
            go.
          </Text>

          <Text style={{ ...styles.paragraph, display: 'inline' }}>
            Say hello to{' '}
          </Text>
          <Code>{domainUnicodeName}</Code>
          <Text style={{ ...styles.paragraph, display: 'inline' }}>
            {' '}
            - it's all yours now. Whether you're building a website, setting up
            email, or just securing your perfect name, you're ready to start.
          </Text>
          <table
            className="namefi-button-row"
            role="presentation"
            cellPadding={0}
            cellSpacing={0}
            style={styles.buttonRowTable}
          >
            <tbody>
              <tr>
                <td className="namefi-button-cell" style={styles.buttonRowCell}>
                  <Button
                    className="namefi-button-mobile"
                    style={styles.button}
                    href={NamefiEmailLinks.domainSettings({
                      domain: domainUnicodeName,
                      poweredByNamefiDomain,
                    })}
                  >
                    Set Up {domainUnicodeName}
                  </Button>
                </td>
                <td
                  className="namefi-button-cell"
                  style={styles.buttonRowCellLast}
                >
                  <Button
                    className="namefi-button-mobile"
                    style={styles.button}
                    href={NamefiEmailLinks.dashboard({ poweredByNamefiDomain })}
                  >
                    Go To Namefi Dashboard
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </NamefiEmailContainer>
      );
    },
    {
      domainUnicodeName: 'namefi.test',
    },
  );

// biome-ignore lint/style/noDefaultExport: required for react-email
export default RegisteredDomainSuccessfully;
