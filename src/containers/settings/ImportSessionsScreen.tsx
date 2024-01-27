import { Component, ReactElement } from 'react';
import { inject, observer } from 'mobx-react';
import { StoresProps } from '../../@types/ferdium-components.types';
import ImportSessions from '../../components/settings/ImportSessions';

interface IProps extends Partial<StoresProps> {}

@inject('stores', 'actions')
@observer
class ImportSessionsScreen extends Component<IProps> {
  render(): ReactElement {
    const { user } = this.props.stores!;

    return <ImportSessions loginRoute={user.loginRoute} />;
  }
}

export default ImportSessionsScreen;
