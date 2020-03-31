import React, { Component } from 'react';
//we use axios to substitute the native fetch
import axios from 'axios';
import './App.css';

const DEFAULT_QUERY = 'redux';
//this is used to fetch 100 requests when we press the more button
const DEFAULT_HPP = '100';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
//this is to deal with paginated data (a list)
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

const largeColumn = {
  width: '40%',
};

const midColumn = {
  width: '30%',
};

const smallColumn = {
  width: '10%',
};

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      //define initial state for searchTerm property in constructor
      //since input field is empty initially, we instantiate with empty string
      //searchTerm: '',
      
      //since we are fetching real data, remove hard coded list
      //this means our initial state has empty result, so result: null
      //searchKey is used to store the most recent search that was submitted to searchTerm,
      //as the value of searchTerm will always change once the user submits a new term
      //error is used for error handling in case of erroneuos API request
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      error: null,
    };

    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
  }

  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }

  //fetching next page of data will override previous page of data
  setSearchTopStories(result) {
    const { hits, page } = result;
    //we set the result to store to the local component state
    const{searchKey, results} = this.state;

    //if page is 0 -> new search request from componentDidMount() or onSearchSubmit()
    //when you click button to fetch paginated data page !== 0
    //old hits are stored in local sate
    //? = if
    //if results[searchKey].hits is true
    //save to map []
    const oldHits = results && results[searchKey]
      ? results[searchKey].hits
      : [];

    //we concatenate data using ... to combine old and new lists from local state and new result object
    const updatedHits = [
      ...oldHits,
      ...hits
    ];

    //[searchKey]: {hits: updatedHits, page}
    //this part stores the updated result by searchKey in the results map
    //which is a value that stores an object with a hits and page property
    //[]: ... is the syntax to allocate value dynamically in an object
    //...result, is used to spread results by searchKey in the state, 
    //if not we will lose all results that have been stored before
    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      }
    });
  }

  //we use this to search from Hacker News API server-side instead of using search_query
  //thas has been predefined
  //0 is the first response in a paginated data
  //page as second argument, if we dont provide it, we will fallback to page 0 for the initial request
  //so essentially we only ever fetch the first page of every request
  fetchSearchTopStories(searchTerm, page = 0) {
    //fetch(https://hn.algolia.com/api/v1 + /search + ? + query= + searchTerm + page= + page + hitsPerPage + 100)
    //${ } is a template literal used to pass text to a function, in this case fetch()
    //and now since we use axios, we dont need to transform returned data into JSON,
    //as axios returns it as a data object
    axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(result => this.setSearchTopStories(result.data))
      .catch(error => this.setState({ error }));
  }


  //now we use componentDidMount to deal with data fetched from fetchSearchTopStories()
  componentDidMount() {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });
    this.fetchSearchTopStories(searchTerm);
  }

  onSearchChange(event){
    // event has value of input field in target object, so we update local state with search term using this.setState()
    this.setState({ searchTerm: event.target.value });
  }

  //we use this to search server-side using Hacker News API
  //if we pass using const search_query = "value" we will be
  //searching client-side, which deals with API response using componentDidMount()
  onSearchSubmit(event) {
    const { searchTerm } = this.state;
    this.setState({ searchKey: searchTerm });

    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }

    event.preventDefault();
  }

  onDismiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];
    //using setstate() to read complex object result
    //instead of mutating object directly, we generate a new one by using
    //... (triple dot) which copies each value pair into a new object (ES6 array spread operator)
    const isNotId = item => item.objectID !== id;
    const updatedHits = hits.filter(isNotId);

    this.setState({
      results: {
        ...results,
        [searchKey]: { hits: updatedHits, page }
      }
    });
  }

  render(){
    //component is initialized by constructor
    //we prevented it from displaying anything, because result in local state is null
    //componentDidMount() fetched data from Hacker News API,
    //then changes local component state in setSearchTopStories()
    //update lifecycle activates since local state was updated, render() gets run again
    //we are storing searchKey in the results[] map 
    //const page is used to fallback to page 0 in case no page argument is provided
    //searchKey will be used to store the previous result as cache
    //searchKey is non-fluctuant for paginated cache
    //searchTerm is
    const {
      searchTerm,
      results,
      searchKey,
      error
    } = this.state;

    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
    ) || 0;

    const list = (
      results &&
      results[searchKey] &&
      results[searchKey].hits
    ) || [];

    return(
      <div className="page">
        <div className="interactions">
          {/* Creating separate componenets for search input and items list */}
          <Search
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
          >
            {/* to display the "Search" word beside the search bar */}
            Search
          </Search>
        </div>
        {/*no need for condition to return table anymore since if there is no data we default to empty list*/}
        { error
          ? <div className="interactions">
            <p>Something went wrong.</p>
          </div>
          : <Table
            list={list}
            onDismiss={this.onDismiss}
          />
        }
        <div className="interactions">
          <Button onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
            More
          </Button>
        </div>
      </div>
    );
  }
}

//refactor from Class Search (ES6 component)
//to functional stateless component (React)
//=> is implicit return so we can remove return()
//we use functional stateless when we do not need to access state or lifecycle components
//but if we need to acccess them, we refactor them into es6 components
const Search = ({
  value,
  onChange,
  onSubmit,
  children
}) =>
  <form onSubmit={onSubmit}>
    <input
      type="text"
      value={value}
      onChange={onChange}
      />
      <button type="submit">
        {children}
      </button>
  </form>

const Table = ({list, onDismiss}) =>
  <div className="table">
    {/* we destructure the list we declared on top into multiple properties */}
      {list.map(item =>
        <div key={item.objectID} className="table-row">
          <span style={largeColumn}>
            <a href={item.url}>{item.title}</a>
          </span>
          <span style={midColumn}>
            {item.title}
          </span>
          <span style={smallColumn}>
            {item.publisher}
          </span>
          <span style={smallColumn}>
            {item.pages}
          </span>
          <span style={smallColumn}>
          {/* () is used to pass item.ObjectID to onDismiss function so the function knows which item to dismiss 
          <button onClick= {this.onDismiss(item.ObjectID} type="button> ; will not work
          instead of passing entire () => at the button, can simplify to
          <button onCLick={onHandleDismiss} type="button"> */}
          {/* <button onClick={() => this.onDismiss(item.objectID)} type="button"> */}
          <Button onClick={() => onDismiss(item.objectID)} className="button-inline">
            {/* we can omit type="button" as we have already specified in the Button component */}
            Dismiss
          </Button>
          </span>
      </div>
    )}
  </div>

const Button = ({
  onClick, 
  className = '', 
  children,
}) =>
  <button
        onClick={onClick}
        className={className}
        type="button"
      >
        {children}
  </button>

export default App;
