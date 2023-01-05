import "./GameItem.scss";
import ReactTooltip from 'react-tooltip';
import { Button, ButtonGroup, Container, Figure } from 'react-bootstrap';
import { authContext } from "../../providers/AuthProvider";
import { useState, useContext } from "react";
import axios from "axios";
import { FaSteam } from "react-icons/fa";

export default function GameItem(props) {
  const {coords, game, handleHighlight} = props;
  const [xCoord, yCoord] = coords.split(",");
  const { user } = useContext(authContext);
  const [isFavorite, setIsFavorite] = useState(false);

  const parsedGenre = game.genres.map(genreObj => genreObj.description).join(" | ");  

  // Favorite and unfavorite functions using backend
  const favoriteGame = gameId => {
    axios.post(`/api/users/${user.id}/favorites`, {"steamAppId": gameId})
      .then(res => {
        setIsFavorite(res.data === "Success");
      })
      .catch(err => {
        console.log(err);
      })
  };
  const unfavoriteGame = gameId => {
    axios.delete(`/api/users/${user.id}/favorites/${gameId}`)
      .then(res => {
        setIsFavorite(prev => res.data === "Success" ? !prev : prev);
      })
      .catch(err => {
        console.log(err);
      })
  }

  let highlightColor = "";
  if (game.highlight.isHighlighted && game.highlight.user === "1" ) highlightColor = game.highlight.color;
  if (game.highlight.isHighlighted && game.highlight.user === "2" ) highlightColor = game.highlight.color;   

  
  // Check if favorited on hover
  const checkFavorite = () => {
    if (user) {
      console.log("User checking fav")
      axios.get(`/api/users/${user.id}/favorites/${game.steam_appid}`)
        .then( res => {
          setIsFavorite(res.data);
        })
        .catch(err => {
          console.log(err);
        })
    }
  }


  return (
    <>
      <a 
        data-for={game.name}
        data-tip
        className={game.highlight.isHighlighted ? "item game-item highlighted" : "item game-item"}
        href={`https://store.steampowered.com/app/${game.steam_appid}`}
        style={{borderColor: `${highlightColor}`,  "backgroundImage": `url(${game.header_image})`, "left": `${xCoord}%`, "bottom": `${yCoord}%`}}
      >  
      </a>
          
      <div onWheel={event => event.stopPropagation()}>
        <ReactTooltip 
          id={game.name} 
          place="top" 
          type="dark" 
          effect="solid" 
          delayHide={50} 
          className="hover-info"
          afterShow={event => checkFavorite()}
        >
          <Figure>
            <Figure.Image
              width="auto"
              height={180}
              src={game.header_image}
              style={{maxWidth: 300}}
            />          
          </Figure>
          <Container>
            <h5 style={{wordWrap: "break-word", maxWidth: 280}}>{game.name}</h5>
            <p>{game.price_overview.final_formatted} | Released Year : {game.release_date.date.slice(-4) || "N/A"}</p>
            <p style={{wordWrap: "break-word", maxWidth: 280}}>{parsedGenre}</p>
            <p></p>
          </Container>
          <Container>
            <ButtonGroup className="my-2">
              <Button variant="info" onClick={() => handleHighlight(game.name)}>Highlight</Button>
              {isFavorite ?
                <Button
                  variant="warning"
                  onClick={ event => {
                    unfavoriteGame(game.steam_appid)
                  }}
                >
                  ♥ Favorited
                </Button>
                :
                <Button
                  variant="warning"
                  onClick={ event => {
                    favoriteGame(game.steam_appid)
                  }}
                >
                  ♡ Favorite
                </Button>
              }            
            </ButtonGroup>
            <FaSteam style={{marginLeft: "30px", fontSize: "25px"}}/>        
          </Container>
        </ReactTooltip>
      </div>
    </> 
  )
}

