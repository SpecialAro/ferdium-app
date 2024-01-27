import { Component, ReactElement } from 'react';
import { observer, inject } from 'mobx-react';
import { defineMessages, injectIntl, WrappedComponentProps } from 'react-intl';
import { io } from 'socket.io-client';
import { rm } from 'fs-extra';
import AdmZip from 'adm-zip';
import Link from '../ui/Link';
import { H1 } from '../ui/headline';
import { StoresProps } from '../../@types/ferdium-components.types';
import Button from '../ui/button';
import { userDataPath } from '../../environment-remote';

const debug = require('../../preload-safe-debug')('Ferdium:App:ImportSessions');

const partitionsPath = userDataPath('Partitions');

const messages = defineMessages({
  signupButton: {
    id: 'welcome.signupButton',
    defaultMessage: 'Create a free account',
  },
  loginButton: {
    id: 'welcome.loginButton',
    defaultMessage: 'Login to your account',
  },
  changeServerMessage: {
    id: 'login.changeServerMessage',
    defaultMessage:
      'You are using {serverNameParse} Server, do you want to switch?',
  },
  changeServer: {
    id: 'login.changeServer',
    defaultMessage: 'Change here!',
  },
  serverless: {
    id: 'services.serverless',
    defaultMessage: 'Use Ferdium without an Account',
  },
});

interface IProps extends Partial<StoresProps>, WrappedComponentProps {
  loginRoute: string;
}

interface IState {
  socketCode: string;
  isSocketConnected: boolean;
  isLoadingData: boolean;
  isFileReceived: boolean;
}

@inject('actions')
@observer
class ImportSessions extends Component<IProps, IState> {
  socket = io('http://192.168.1.64:3000');

  handleSessionInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ socketCode: event.target.value });
  };

  constructor(props: IProps) {
    super(props);
    this.state = {
      socketCode: '',
      isSocketConnected: false,
      isLoadingData: false,
      isFileReceived: false,
    };
  }

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

    socket.on('receive-file', async data => {
      this.setState({ isLoadingData: true });

      debug('Receiving file');

      // Handle received data here
      const { buffer } = data;
      const code = this.state.socketCode;
      await rm(partitionsPath, { recursive: true, force: true });

      // Extract to path
      const zip = new AdmZip(buffer);
      zip.extractAllTo(partitionsPath, true);

      socket.emit('file-received', code);
      this.setState({ isLoadingData: false, isFileReceived: true });
    });
  }

  componentWillUnmount(): void {
    this.socket.disconnect();
  }

  render(): ReactElement {
    const { loginRoute, intl } = this.props;

    const { isSocketConnected, isLoadingData, isFileReceived } = this.state;

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const receiveSessionData = () => {
      const { socket } = this;
      debug(this.state.socketCode);
      socket.emit('join-channel', this.state.socketCode);
    };

    return (
      <div className="welcome">
        <div className="welcome__content">
          <img
            src="./assets/images/logo.svg"
            className="welcome__logo"
            alt=""
          />
        </div>
        <div className="welcome__text">
          <H1>Ferdium</H1>
        </div>
        <div className="welcome__buttons">
          {isSocketConnected && !isFileReceived && (
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
                  flexDirection: 'column',
                  height: 'fit-content',
                  padding: '1rem',
                  alignItems: 'center',
                }}
              >
                <input
                  type="text"
                  placeholder="Enter session code"
                  style={{ marginLeft: '1rem', width: '10rem' }}
                  value={this.state.socketCode}
                  onChange={this.handleSessionInputChange}
                />
                <Button
                  label="Receive session data"
                  className="franz-form__button--inverted"
                  disabled={!this.state.socketCode || isLoadingData}
                  onClick={receiveSessionData}
                />
              </div>
            </div>
          )}
          {isFileReceived && (
            <Link to={loginRoute} className="button">
              {intl.formatMessage(messages.loginButton)}
            </Link>
          )}
          <hr
            className="settings__hr-sections"
            style={{ marginTop: 24, marginBottom: 24, borderStyle: 'solid' }}
          />
        </div>
      </div>
    );
  }
}

export default injectIntl(ImportSessions);
