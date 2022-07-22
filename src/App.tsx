import axios, { AxiosResponse } from 'axios';
import { useState, useEffect, useRef } from 'react';
import { TwitchPlayer } from 'twitch-player';

interface LeaderboardEntry {
  place: number;
  run: {
    date: string;
    players: {
      id: string;
      uri: string;
      name: string;
    }[];
    status: {
      status: string;
      'verify-date': string;
    };
    times: {
      realtime_t: number;
      primary_t: number;
    };
    videos: {
      links: { uri: string }[];
    };
  };
}

interface SpeedrunArray {
  runs: LeaderboardEntry[];
}

function App() {
  const [leaderBoard, setLeaderboard] = useState<SpeedrunArray | null>(null);
  const vodElement = useRef();

  let leader: LeaderboardEntry | undefined = undefined;
  if (leaderBoard) {
    leader = leaderBoard.runs[0];
  }

  /* ------------------------------ API request ----------------------------- */
  useEffect(() => {
    const getData = (game: string, category: string) => {
      const getLeaderBoardData = async (
        a: string,
        b: string
      ): Promise<AxiosResponse> => {
        const res: AxiosResponse = await axios.get(
          'https://www.speedrun.com/api/v1/leaderboards/' + a + '/category/' + b
        );
        return res;
      };

      getLeaderBoardData(game, category).then(async (r: AxiosResponse) => {
        const player: AxiosResponse = await axios.get(
          r.data.data.runs[0].run.players[0].uri
        );
        const leaderBoardData = r.data.data;
        leaderBoardData.runs[0].run.players[0].name =
          player.data.data.names.international;
        setLeaderboard(leaderBoardData);
      });
    };

    getData('yo1yv1q5', '4xk906k0');
  }, []);

  /* ------------------------- Twitch player render ------------------------- */
  useEffect(() => {
    if (leader) {
      TwitchPlayer.FromOptions('webPlayer', {
        height: 480,
        width: 856,
        video: leader.run.videos.links[0].uri.split('/')[4],
      });
    }
  }, [leader]);

  const renderDuration = (): string | null => {
    if (leader) {
      const date1ms: number = new Date(
        leader.run.status['verify-date']
      ).getTime();
      const date2ms: number = new Date(Date.now()).getTime();
      const timeInMs: number = new Date(date2ms - date1ms).getTime();

      const days: number = Math.floor(timeInMs / 1000 / 60 / 60 / 24);
      const hours: number = Math.floor(
        (timeInMs - days * 24 * 60 * 60 * 1000) / 1000 / 60 / 60
      );

      return `${days} days and ${hours} hours`;
    }
    return null;
  };

  const renderPlayerName = (): string | null => {
    if (leader) {
      return leader.run.players[0].name;
    }
    return null;
  };

  const renderRecordHistory = (): JSX.Element => {
    if (leaderBoard) {
      filterRecords(leaderBoard.runs);
    }
    return <></>;
  };

  const filterRecords = (
    inputArray: LeaderboardEntry[]
  ): LeaderboardEntry[] | void => {
    // left verified date needs to be less than right verified date
    // also need to have an index reference to the last found record?
    //
    // for any given date, a record would be the fastest time on the leaderboard
    // for each entry, look at the date and look to the left if there was a
    // faster run already. if there was not one, add it to the records array

    // this function works correctly but doesnt achieve the set goal -- the api
    // data is incomplete. i'm going to leave it in here because i still think
    // its kinda nifty that i figured this out
    let leftHand;
    const recordsArray: LeaderboardEntry[] = [];
    for (const element of inputArray) {
      if (element.place === 1) {
        leftHand = element;
        recordsArray.push(element);
      }

      if (
        leftHand &&
        new Date(leftHand.run.date) > new Date(element.run.date)
      ) {
        recordsArray.push(element);
        leftHand = element;
      }
    }

    return recordsArray;
  };

  return (
    <div className="w-screen h-screen">
      {leader ? (
        <div className="flex flex-col justify-start items-center p-4 h-full">
          <div className="flex flex-col items-center pb-8">
            <h1 className="text-xl text-center">
              The Current Grand Theft Auto: San Andreas Any% No AJS speedrun
              record is:
            </h1>
            <p className="text-5xl pt-2">
              {new Date(leader.run.times.realtime_t * 1000)
                .toISOString()
                .substring(11, 19)}
            </p>
          </div>
          <div className="flex flex-col items-center pb-8">
            <h2 className="text-center">And was set by</h2>
            <p className="text-5xl pt-2">{renderPlayerName()}</p>
          </div>
          <div className="flex flex-col items-center pb-8">
            <h2 className="text-center">They have held the record for:</h2>
            <p className="text-2xl pt-2">{renderDuration()}</p>
          </div>
          <h3 className="text-center">Run VOD:</h3>
          <div id="webPlayer" ref={vodElement.current}></div>
          {renderRecordHistory()}
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default App;
