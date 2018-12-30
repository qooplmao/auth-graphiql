import React, {Component} from 'react';
import GraphiQL from 'graphiql';
import fetch from 'isomorphic-fetch';
import { Auth } from 'aws-amplify';
import './App.css';
import '../node_modules/graphiql/graphiql.css';

class App extends Component {

  constructor(props) {
    super(props);

    var search = window.location.search;
    var parameters = {};
    search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] = decodeURIComponent(entry.slice(eq + 1));
      }
    });

    if (parameters.variables) {
      try {
        parameters.variables = JSON.stringify(JSON.parse(parameters.variables), null, 2);
      } catch (e) {}
    }

    this.state = {
      query: parameters.query,
      variables: parameters.variables,
      username: false,
      password: false,
      authenticatedAs: false
    };

    Auth
      .currentSession()
      .then(({ idToken: { payload: { email }}}) => {
        this.setState({
          authenticatedAs: email
        });
      })
    ;
  }

  onChange = key => value => {
    if (value.target) {
      value = value.target.value;
    }

    this.setState({
      [key]: value
    }, () => {
      this.updateURL();
    })
  };

  updateURL = () => {
    const newSearch = '?' + ['query', 'variables']
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(this.state[key]))
      .join('&');

    window.history.replaceState(null, null, newSearch);
  };

  onLogin = () => {
    Auth.signIn(this.state.username, this.state.password)
      .then(() => {
        this.setState({
          authenticatedAs: this.state.username,
          username: false,
          password: false
        });
      })
      .catch(error => {
        console.error(error);
      })
    ;
  };

  onLogout = () => {
    Auth.signOut()
      .then(() => {
        this.setState({
          authenticatedAs: false
        });
      })
      .catch(error => {
        console.error(error);
      })
    ;
  };

  graphQlFetcher = graphQlParams => {
    if (!this.state.authenticatedAs) {
      return this.doCall(graphQlParams);
    }

    return Auth
      .currentSession()
      .then(({ accessToken: { jwtToken }}) => {
        return this.doCall(graphQlParams, jwtToken);
      })
    ;
  };

  doCall = (graphQLParams, jwtToken = false) => {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    }

    return fetch(process.env.REACT_APP_GRAPHQL_ENDPOINT_URL, {
      method: 'post',
      headers,
      body: JSON.stringify(graphQLParams),
    }).then(response => response.json());
  };

  render() {
    return (
      <div className="app">
        <div className="header">
          {this.state.authenticatedAs && (
            <span>
              Logged in as {this.state.authenticatedAs}
              <button type="button" onClick={this.onLogout}>Logout</button>
            </span>
          )}
          {!this.state.authenticatedAs && (
            <span>
              <label>
                username
                <input type="text" onChange={this.onChange('username')} value={this.state.username || ''} />
              </label>
              <label>
                username
                <input type="password" onChange={this.onChange('password')} value={this.state.password || ''} />
              </label>
              <button type="button" onClick={this.onLogin}>Login</button>
            </span>
          )}
        </div>
        <div className="body">
          <GraphiQL fetcher={this.graphQlFetcher}
                    query={this.state.query}
                    variables={this.state.variables}
                    onEditQuery={this.onChange('query')}
                    onEditVariables={this.onChange('variables')}
          />
        </div>
      </div>
    );
  }
}

export default App;

