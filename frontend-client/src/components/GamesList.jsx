import axios from 'axios'
import Game from './Game'
import { useEffect, useState, useContext } from "react";
import { stateContext } from "../providers/StateProvider";
import io from 'socket.io-client';


const GamesList = () => {

  const { state, setGamesList, setSocket, setOSFilter, setGenreFilter, setNumericFilters } = useContext(stateContext);
  const { setPrices, setRatings, setYears } = setNumericFilters;
  const [ filteredGamesList, setFilteredGameList ] = useState([]);
  
  const filterGamesListArray = (inputList, filters) => {
    console.log("::Input Length", inputList.length);
    const filteredByPrice = filterByPrice(inputList, filters.centPrices);
    const filteredByRating = filterByRating(filteredByPrice, filters.rating);
    const filteredByYear = filterByYear(filteredByRating, filters.years);
    const filteredByGenre = filterByGenre(filteredByYear, filters.genres);
    const filteredByOS = filterByOS(filteredByGenre, filters.os);
    const filteredByName = filterByName(filteredByOS, filters.name);
    console.log("::Output Length", filteredByName.length);
    return filteredByName;
  } 

  const filterByPrice = (inputArray, priceFilter) => {
    const outputArray = [];
    inputArray.forEach(game => {
      if (game.price_overview && game.price_overview.final >= priceFilter[0] && game.price_overview.final <= priceFilter[1]) {
        outputArray.push(game)
      }
    });
    return outputArray
  };

  const filterByRating = (inputArray, ratingFilter) => {
    const outputArray = [];
    inputArray.forEach(game => {
      if (!game.metacritic) game.metacritic = { score: 0 };      
      if (game.metacritic && game.metacritic.score >= ratingFilter[0] && game.metacritic.score <= ratingFilter[1]) {
        outputArray.push(game)
      }
    });
    return outputArray
  };

  const filterByYear = (inputArray, yearFilter) => {
    const outputArray = [];
    inputArray.forEach(game => {
      if (game.release_date && game.release_date.date.slice(-4) >= yearFilter[0] && game.release_date.date.slice(-4) <= yearFilter[1]) {
        outputArray.push(game)
      }
    });
    return outputArray
  }; 
  
  const filterByGenre = (inputArray, genreFilter) => {
    const outputArray = [];
    const selectedGenres = Object.keys(genreFilter).filter(key => genreFilter[key]);
    if (!selectedGenres.length) return inputArray;
    inputArray.forEach(game => {
      const gameGenres = game.genres.map(genreObj => genreObj.description);      
      if (selectedGenres.every(genre => gameGenres.includes(genre))) outputArray.push(game);
    });
    
    return outputArray;
  };

  const filterByOS = (inputArray, osFilter) => {
    const outputArray = [];
    const selectedOS = Object.keys(osFilter).filter(key => osFilter[key]);
    if (!selectedOS.length) return inputArray;
    inputArray.forEach(game => {
      const gameListedOS = Object.keys(game.platforms).filter(key => game.platforms[key])
      if (selectedOS.every(OS => gameListedOS.includes(OS))) outputArray.push(game);
    })
    return outputArray;
  };

  const filterByName = (inputArray, nameFilter) => {    
    if (!nameFilter) return inputArray;
    const searchName = nameFilter.toLowerCase().trim();
    const outputArray = inputArray.filter(game => {
      const gameName = game.name.toLowerCase();
      return gameName.includes(searchName);
    })
    return outputArray;
  };


  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    console.log("#####PINGING BACKEND DEALS/DB ENDPOINT#####");
    console.log(state.filters);
    // const url = `/api/search/deals`;
    const url = `/api/search/database`;
    axios.get(url)
    .then(res => {
      console.log("::Backend API Received Data Length:", res.data.length)
      setGamesList(res.data);
    })
    .catch(err => console.log(err))
    
    return () => {
      newSocket.close();
    };
  }, []);

  
  useEffect(() => {
    const filteredArray = filterGamesListArray(state.gamesList, state.filters);
    setFilteredGameList(filteredArray);    
  }, [state.filters, state.gamesList])


  useEffect(() => {
    if (state.socket) {
      state.socket.on('filter-state', (filterData) => {
        console.log(filterData);
        setOSFilter(filterData.os);
        setGenreFilter(filterData.genres);
        setPrices(filterData.centPrices);
        setRatings(filterData.rating);
        setYears(filterData.years);
      })    
    }
  }, [state.socket])


  useEffect(() => {
    if (state.socket) {
      state.socket.emit('filter-state', state.filters);
    }
    const nameSearch = state.filters.name;
    const searchLimit = 999;
    const url = `/api/search/games?title=${nameSearch}&limit=${searchLimit}`;
    if (nameSearch) {
      console.log("#####PINGING BACKEND NAME ENDPOINT####");
      axios.get(url)
      .then(res => {
        console.log("::Name Search Route Data Length:", res.data.length)
        setGamesList(res.data);
      })
      .catch(err => console.log(err))        
    }
  }, [state.buttonToggles])

  
  const parsedGameInfo = filteredGamesList.map(game => {
  const genresArray = game.genres.map(genre => ` ${genre.description}`)
    return <Game 
      key={game.steam_appid} 
      name={game.name}
      price={game.price_overview.final_formatted}
      genre={genresArray}
    />
  })   

  return (
    <div>
      <h5>Games List</h5>
      {parsedGameInfo}      
    </div>
  )
}

export default GamesList
