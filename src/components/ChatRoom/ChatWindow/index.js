import classNames from "classnames/bind";
import styles from "./ChatWindow.module.scss";
import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faArrowDown,
  faEllipsisH,
} from "@fortawesome/free-solid-svg-icons";

import { useContext, useState, useRef, useEffect, useMemo, memo } from "react";
import { AppContext } from "../../../Context/AppProvider";

import useFirestore from "../../../hooks/useFirestore";

import messageSound from "../../../assets/sounds/message.wav";
import placeHolderImg from "../../../assets/images/user.png";

import RoomOptions from "../RoomOptions";
import CustomNickname from "../../Modals/CustomNickname";
import ChangeRoomName from "../../Modals/ChangeRoomName";
import MessagesForm from "../MessagesForm";
import MessagesList from "../MessagesList";

// import { doc, updateDoc } from "firebase/firestore";
// import { db } from "../../../firebase/config";

const cx = classNames.bind(styles);

function ChatWindow({ roomId }) {
  const {
    rooms,
    roomsActiveStatus,
    setSelectedRoomId,
    isMobile,
    handleRoomMenuVisible,
    isRoomMenuVisible,
    setSelectedRoomMessages,
  } = useContext(AppContext);

  const [currentMessage, setCurrentMessage] = useState("");
  const [isMutedSound, setIsMutedSound] = useState(true);
  const [isScrollToBottom, setIsScrollToBottom] = useState(false);
  const [totalLoadingMessages, setTotalLoadingMessages] = useState(10);

  const mesListRef = useRef();
  const LastMesListRef = useRef();

  // Set room ID (AppContext) when selected room or load
  useEffect(() => {
    setSelectedRoomId(roomId);
  }, [roomId, setSelectedRoomId]);

  // HANDLE GET MESSAGES
  // Get current room messages
  const messagesCondition = useMemo(() => {
    // Get messages with the same roomId field as (current) roomId
    return {
      fielName: "roomId",
      operator: "==",
      compareValue: roomId,
    };
  }, [roomId]);

  const messages = useFirestore("messages", messagesCondition);

  // Global
  useEffect(() => {
    setSelectedRoomMessages(messages);
  }, [messages, setSelectedRoomMessages]);

  // Get selected room with room id
  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === roomId),
    [rooms, roomId]
  );

  // Play sound when have new message
  useEffect(() => {
    if (messages.length) {
      const messagesLength = messages.length;
      setCurrentMessage(messages[messagesLength - 1]);
    }
  }, [messages]);

  useEffect(() => {
    const audio = new Audio(messageSound);
    audio.volume = 0.5;
    if (isMutedSound) {
      audio.muted = true;
    } else {
      audio.muted = false;
      audio.play();
    }
  }, [currentMessage.id, isMutedSound]);

  // Handle scroll when have new message
  const handleScrollToBottom = () => {
    mesListRef.current.scrollTo({
      top: mesListRef.current.scrollHeight,
      left: 0,
      behavior: "instant",
    });
  };
  useEffect(() => {
    if (mesListRef.current) {
      handleScrollToBottom();
    }
  }, [currentMessage.id, roomId]);

  useEffect(() => {
    if (mesListRef.current) {
      const mesListRefNew = mesListRef.current;

      const handleToggleScrollBottom = () => {
        const scrollTop = mesListRef.current.scrollTop;
        const scrollHeight = mesListRef.current.scrollHeight;
        const clientHeight = mesListRef.current.clientHeight;

        if (scrollTop < scrollHeight - clientHeight - 60) {
          setIsScrollToBottom(true);
        } else {
          setIsScrollToBottom(false);
        }
      };

      mesListRefNew.addEventListener("scroll", handleToggleScrollBottom);

      return () => {
        mesListRefNew.removeEventListener("scroll", handleToggleScrollBottom);
      };
    }
  }, []);

  // useEffect(() => {
  //   if (LastMesListRef.current) {
  //     LastMesListRef.current.scrollIntoView({
  //       behavior: "smooth",
  //       block: "center",
  //       inline: "nearest",
  //     });
  //   }
  // }, [currentMessage.id]);

  // Handle load more messages
  useEffect(() => {
    if (mesListRef.current) {
      const mesListRefNew = mesListRef.current;
      const handleLoadMoreMessages = () => {
        const scrollTop = mesListRef.current.scrollTop;
        if (scrollTop === 0) {
          setTotalLoadingMessages((prev) => {
            if (prev < messages.length - 11) {
              return prev + 10;
            } else return prev;
          });

          mesListRef.current.scrollTo({
            top: mesListRef.current.scrollTop + 50,
            left: 0,
            behavior: "instant",
          });
        }
      };

      mesListRefNew.addEventListener("scroll", handleLoadMoreMessages);

      return () => {
        mesListRefNew.removeEventListener("scroll", handleLoadMoreMessages);
      };
    }
  }, [messages.length]);

  // Handle side by side messages with the same sender
  const sideBySideMessages = useMemo(() => {
    // const newMessages = [...messages];
    const newMessages = messages.slice(messages.length - totalLoadingMessages);

    if (newMessages.length >= 3) {
      for (let i = 0; i < newMessages.length; i++) {
        if (i === 0) {
          if (newMessages[i].uid === newMessages[i + 1].uid) {
            newMessages[i].posType = "first-message";
          } else newMessages[i].posType = "default";
        } else if (i === newMessages.length - 1) {
          if (newMessages[i].uid === newMessages[i - 1].uid) {
            newMessages[i].posType = "last-message";
          } else newMessages[i].posType = "default";
        } else {
          if (
            newMessages[i].uid === newMessages[i + 1].uid &&
            newMessages[i].uid === newMessages[i - 1].uid
          ) {
            newMessages[i].posType = "middle-message";
          } else if (newMessages[i].uid === newMessages[i + 1].uid) {
            newMessages[i].posType = "first-message";
          } else if (newMessages[i].uid === newMessages[i - 1].uid) {
            newMessages[i].posType = "last-message";
          } else {
            newMessages[i].posType = "default";
          }
        }
      }
    } else if (newMessages.length === 2) {
      if (newMessages[0].uid === newMessages[1].uid) {
        newMessages[0].posType = "first-message";
        newMessages[1].posType = "last-message";
      } else {
        newMessages[0].posType = "default";
        newMessages[1].posType = "default";
      }
    } else if (newMessages.length === 1) {
      newMessages[0].posType = "default";
    }
    return newMessages;
  }, [messages, totalLoadingMessages]);

  const findRoomActive = (roomId) => {
    const roomActive = roomsActiveStatus.find(
      (roomActive) => roomActive.roomId === roomId
    );
    if (roomActive) {
      if (roomActive.isActive) {
        return "Đang hoạt động";
      } else {
        return (
          roomActive.timeCount && `Hoạt động ${roomActive.timeCount} trước`
        );
      }
    }
  };

  // Update format from firestore
  // useEffect(() => {
  //   messages.forEach((message) => {
  //     let messageRef = doc(db, "messages", message.id);
  //     updateDoc(messageRef, {
  //       fullPath: "",
  //     });
  //   });
  // }, [messages]);

  return (
    <>
      {selectedRoom && (
        <div className={cx("chat-window-wrapper")}>
          <div className={cx("chat-window")}>
            {/*=========== Header ===========*/}
            <div className={cx("chat-window_header")}>
              {/* Room Name And Image */}
              <div className={cx("chat-window_header-info")}>
                {isMobile ? (
                  <Link to={"/room-list"}>
                    <button
                      onClick={() => {
                        // Remove active room
                        setSelectedRoomId("");
                      }}
                      className={cx("back-btn")}
                    >
                      <FontAwesomeIcon icon={faAngleLeft} />
                    </button>
                  </Link>
                ) : (
                  false
                )}

                <img
                  src={selectedRoom.photoURL || placeHolderImg}
                  alt=""
                  className={cx("chat-window_header-img")}
                />
                <div className={cx("chat-window_header-name-wrap")}>
                  <h4 className={cx("chat-window_header-name")}>
                    {selectedRoom.name}
                  </h4>
                  {findRoomActive(roomId) && (
                    <>
                      <p className={cx("chat-desc")}>
                        {findRoomActive(roomId)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Room Controls btn*/}
              <div className={cx("chat-window_header-users")}>
                <i
                  onClick={handleRoomMenuVisible}
                  className={cx("header-menu_icon")}
                >
                  <FontAwesomeIcon icon={faEllipsisH} />
                </i>
              </div>
            </div>

            {/*=========== Message List ===========*/}

            <div ref={mesListRef} className={cx("message-list")}>
              <MessagesList sideBySideMessages={sideBySideMessages} />
              <span ref={LastMesListRef}></span>
            </div>

            {isScrollToBottom && (
              <button
                onClick={() => {
                  handleScrollToBottom();
                }}
                className={cx("to-bottom-btn")}
              >
                <FontAwesomeIcon icon={faArrowDown} />
              </button>
            )}

            {/*=========== Message Form ===========*/}
            <div className={cx("messages-form-wrapper")}>
              <MessagesForm roomId={roomId} setMuted={setIsMutedSound} />
            </div>
          </div>
          {isRoomMenuVisible && (
            <div className={cx("room-option")}>
              <RoomOptions
                messages={messages}
                activeTime={findRoomActive(roomId)}
              />
            </div>
          )}

          <CustomNickname />
          <ChangeRoomName />
        </div>
      )}
    </>
  );
}

export default memo(ChatWindow);
