import io from 'socket.io-client';
import AdmZip from 'adm-zip';
import path from 'node:path';
import * as crypto from 'node:crypto';
import { copy, rm } from 'fs-extra';
import { Component } from 'react';
import { observer } from 'mobx-react';
import {
  type WrappedComponentProps,
  defineMessages,
  injectIntl,
} from 'react-intl';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { H1, H2 } from '../../ui/headline';

import {
  DEFAULT_LOADER_COLOR,
  LIVE_FRANZ_API,
  LOCAL_SERVER,
} from '../../../config';
import Button from '../../ui/button';
import Infobox from '../../ui/infobox/index';
import type User from '../../../models/User';
import { userDataPath } from '../../../environment-remote';
import Loader from '../../ui/loader';

const debug = require('../../../preload-safe-debug')(
  'Ferdium:App:AccountDashboard',
);

const partitionsPath = userDataPath('Partitions');

const tempPath = userDataPath('tmp');
const tempPartitions = path.join(tempPath, 'Partitions');

const createZipFromFolder = (folder: string) => {
  const zip = new AdmZip();

  zip.addLocalFolder(folder);
  const willSendThis = zip.toBuffer();

  return willSendThis;
};

const messages = defineMessages({
  headline: {
    id: 'settings.account.headline',
    defaultMessage: 'Account',
  },
  headlineDangerZone: {
    id: 'settings.account.headlineDangerZone',
    defaultMessage: 'Danger Zone',
  },
  accountEditButton: {
    id: 'settings.account.account.editButton',
    defaultMessage: 'Edit account',
  },
  invoicesButton: {
    id: 'settings.account.headlineInvoices',
    defaultMessage: 'Invoices',
  },
  userInfoRequestFailed: {
    id: 'settings.account.userInfoRequestFailed',
    defaultMessage: 'Could not load user information',
  },
  tryReloadUserInfoRequest: {
    id: 'settings.account.tryReloadUserInfoRequest',
    defaultMessage: 'Try again',
  },
  deleteAccount: {
    id: 'settings.account.deleteAccount',
    defaultMessage: 'Delete account',
  },
  deleteInfo: {
    id: 'settings.account.deleteInfo',
    defaultMessage:
      "If you don't need your Ferdium account any longer, you can delete your account and all related data here.",
  },
  deleteEmailSent: {
    id: 'settings.account.deleteEmailSent',
    defaultMessage:
      'You have received an email with a link to confirm your account deletion. Your account and data cannot be restored!',
  },
  yourLicense: {
    id: 'settings.account.yourLicense',
    defaultMessage: 'Your Ferdium License:',
  },
  accountUnavailable: {
    id: 'settings.account.accountUnavailable',
    defaultMessage: 'Account is unavailable',
  },
  accountUnavailableInfo: {
    id: 'settings.account.accountUnavailableInfo',
    defaultMessage:
      'You are using Ferdium without an account. If you want to use Ferdium with an account and keep your services synchronized across installations, please select a server in the Settings tab then login.',
  },
});

interface IProp extends WrappedComponentProps {
  user: User;
  isLoading: boolean;
  userInfoRequestFailed: boolean;
  isLoadingDeleteAccount: boolean;
  isDeleteAccountSuccessful: boolean;
  server: string;
  retryUserInfoRequest: () => void;
  deleteAccount: () => void;
  openEditAccount: () => void;
  openInvoices: () => void;
}

interface IState {
  socketCode: string | null;
  isSocketConnected: boolean;
  dataToSend?: {
    buffer: Buffer;
    filename: string;
    type: string;
  };
  isLoadingData: boolean;
  sessionInput: string;
}

@observer
class AccountDashboard extends Component<IProp, IState> {
  socket = io('http://100.70.53.63:3000');

  handleSessionInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ sessionInput: event.target.value });
  };

  constructor(props: IProp) {
    super(props);
    this.state = {
      socketCode: null,
      isSocketConnected: false,
      dataToSend: undefined,
      isLoadingData: false,
      sessionInput: '',
    };
  }

  sendSessionData = async () => {
    try {
      // Set loading state to true
      this.setState({ isLoadingData: true });

      // Clean partitions folder
      await rm(tempPath, { recursive: true, force: true });
      await copy(partitionsPath, tempPartitions);

      // Compress path into zip
      const buffer = createZipFromFolder(tempPartitions);
      this.setState({
        dataToSend: {
          buffer,
          filename: 'partitions.zip',
          type: 'zip',
        },
      });

      // Emit the code generation event
      this.socket.emit('generate-code', () => {
        debug('Code generated');
      });

      // Set loading state to false after the code is generated
      this.setState({ isLoadingData: false });
    } catch (error) {
      console.error('Error sending session data:', error);
      // Handle error as needed
      // Set loading state to false in case of an error
      this.setState({ isLoadingData: false });
    }
  };

  componentDidMount(): void {
    const { socket } = this;

    socket.connect();

    socket.on('connect', () => {
      debug('Connected to socket');
      this.setState({ isSocketConnected: true });
    });

    socket.on('disconnect', () => {
      debug('Disconnected from socket');
      this.setState({ isSocketConnected: false });
    });

    socket.on('code', data => {
      debug(data);
      this.setState({ socketCode: data });
    });

    socket.on('file-received', async () => {
      try {
        debug('File received by other client');
        await rm(tempPartitions, { recursive: true, force: true });
        this.setState({ socketCode: null });
      } catch (error) {
        console.error('Error removing files:', error);
        // Handle error as needed
      }
    });

    socket.on('expired', () => {
      debug('Session expired');
      this.setState({ socketCode: null });
    });

    socket.on('ready-to-send', publicKey => {
      const { socketCode, dataToSend } = this.state;

      if (!socketCode || !dataToSend) {
        debug('Not ready to send');
        return;
      }

      // Encrypt dataToSend with publicKey
      const encryptedData = crypto
        .publicEncrypt(publicKey, Buffer.from(JSON.stringify(dataToSend)))
        .toString('base64');

      socket.emit('send-file', socketCode, {
        ...dataToSend,
        buffer: encryptedData,
      });
    });
  }

  componentWillUnmount(): void {
    this.socket.disconnect();
  }

  render() {
    const {
      user,
      isLoading,
      userInfoRequestFailed,
      retryUserInfoRequest,
      deleteAccount,
      isLoadingDeleteAccount,
      isDeleteAccountSuccessful,
      openEditAccount,
      openInvoices,
      server,
    } = this.props;
    const { intl } = this.props;

    const isUsingWithoutAccount = server === LOCAL_SERVER;
    const isUsingFranzServer = server === LIVE_FRANZ_API;

    const { socketCode, isSocketConnected } = this.state;

    return (
      <div className="settings__main">
        <div className="settings__header">
          <span className="settings__header-item">
            {intl.formatMessage(messages.headline)}
          </span>
        </div>
        <div className="settings__body">
          {isUsingWithoutAccount && (
            <>
              <H1 className=".no-bottom-margin">
                {intl.formatMessage(messages.accountUnavailable)}
              </H1>
              <p
                className="settings__message"
                style={{
                  borderTop: 0,
                  marginTop: 0,
                }}
              >
                {intl.formatMessage(messages.accountUnavailableInfo)}
              </p>
            </>
          )}
          {!isUsingWithoutAccount && (
            <>
              {isLoading && <Loader color={DEFAULT_LOADER_COLOR} />}

              {!isLoading && userInfoRequestFailed && (
                <Infobox
                  icon="alert"
                  type="danger"
                  ctaLabel={intl.formatMessage(
                    messages.tryReloadUserInfoRequest,
                  )}
                  ctaOnClick={retryUserInfoRequest}
                >
                  {intl.formatMessage(messages.userInfoRequestFailed)}
                </Infobox>
              )}

              {!userInfoRequestFailed && (
                <>
                  {!isLoading && (
                    <>
                      <div className="account">
                        <div className="account__box account__box--flex">
                          <div className="account__avatar">
                            <img src="./assets/images/logo.svg" alt="" />
                          </div>
                          <div className="account__info">
                            <H1>
                              <span className="username">{`${user.firstname} ${user.lastname}`}</span>
                            </H1>
                            <p>
                              {user.organization && `${user.organization}, `}
                              {user.email}
                            </p>
                            <div className="manage-user-links">
                              <Button
                                label={intl.formatMessage(
                                  messages.accountEditButton,
                                )}
                                className="franz-form__button--inverted"
                                onClick={openEditAccount}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {user.isSubscriptionOwner && isUsingFranzServer && (
                        <div className="account">
                          <div className="account__box">
                            <H2>{intl.formatMessage(messages.yourLicense)}</H2>
                            <p>Franz</p>
                            <div className="manage-user-links">
                              <Button
                                label={intl.formatMessage(
                                  messages.invoicesButton,
                                )}
                                className="franz-form__button--inverted"
                                onClick={openInvoices}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {isUsingFranzServer && (
                    <div className="account franz-form">
                      <div className="account__box">
                        <H2>
                          {intl.formatMessage(messages.headlineDangerZone)}
                        </H2>
                        {!isDeleteAccountSuccessful && (
                          <div className="account__subscription">
                            <p>{intl.formatMessage(messages.deleteInfo)}</p>
                            <Button
                              label={intl.formatMessage(messages.deleteAccount)}
                              buttonType="danger"
                              onClick={() => deleteAccount()}
                              loaded={!isLoadingDeleteAccount}
                            />
                          </div>
                        )}
                        {isDeleteAccountSuccessful && (
                          <p>{intl.formatMessage(messages.deleteEmailSent)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {isSocketConnected && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '100%',
                height: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  height: 'fit-content',
                  padding: '1rem',
                  alignItems: 'center',
                }}
              >
                <Button
                  label="Send session data"
                  className="franz-form__button--inverted"
                  onClick={this.sendSessionData}
                  disabled={this.state.isLoadingData}
                />
                <p style={{ userSelect: 'text', paddingLeft: '1rem' }}>
                  {socketCode}
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  height: 'fit-content',
                  padding: '1rem',
                  alignItems: 'center',
                }}
              >
                <Button
                  label="Receive session data"
                  className="franz-form__button--inverted"
                  // onClick={receiveSessionData}
                />
                <input
                  type="text"
                  placeholder="Enter session code"
                  style={{ marginLeft: '1rem', width: '10rem' }}
                  value={this.state.sessionInput}
                  onChange={this.handleSessionInputChange}
                />
              </div>
            </div>
          )}
        </div>
        <ReactTooltip
          place="right"
          variant="dark"
          float
          style={{ height: 'auto' }}
        />
      </div>
    );
  }
}

export default injectIntl(AccountDashboard);
