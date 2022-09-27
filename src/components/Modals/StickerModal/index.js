import classNames from "classnames/bind";
import styles from "./StickerModal.module.scss";
import {
  faFaceSmile,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useContext, useRef, useState } from "react";
import { AppContext } from "../../../Context/AppProvider";
import { deleteFile, uploadFile } from "../../../firebase/service";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";

const cx = classNames.bind(styles);

function StickerModal({ sendMessage }) {
  const { currentUser } = useContext(AppContext);

  const [editStickers, setEditSticker] = useState(false);

  const inputStickerRef = useRef();

  const handleUploadSticker = (e) => {
    if (e.target.files[0].size < 3000000) {
      uploadFile(
        e.target.files[0],
        `images/users_stickers/${currentUser.uid}`,
        (url, fullPath) => {
          const userRef = doc(db, "users", currentUser.id);
          updateDoc(userRef, {
            stickers: arrayUnion({ url, fullPath }),
          });
        }
      );
    } else {
      alert("File sticker phải có kích thước < 3MB");
    }
  };

  const handleRemoveSticker = (fullPath) => {
    const newStickers = currentUser.stickers.filter(
      (sticker) => sticker.fullPath !== fullPath
    );

    const userRef = doc(db, "users", currentUser.id);
    updateDoc(userRef, {
      stickers: newStickers,
    });

    // Remove file from Storage
    deleteFile(fullPath);
  };

  const handleSendMessage = (photoURL) => {
    if (!editStickers) {
      sendMessage("sticker", photoURL, null, "@sticker");
    }
  };

  return (
    <div className={cx("wrapper")}>
      <input
        ref={inputStickerRef}
        onChange={handleUploadSticker}
        style={{ display: "none" }}
        type="file"
        accept="image/*"
        name=""
        id=""
      />
      <button
        onClick={() => {
          inputStickerRef.current.click();
        }}
        className={cx("add-stickers-btn")}
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>

      <ul className={cx("stickers-header")}>
        <li className={cx("stickers-header_item")}>
          <FontAwesomeIcon icon={faFaceSmile} />
        </li>
      </ul>
      <div className={cx("stickers-content-wrap")}>
        <ul className={cx("stickers-content")}>
          {currentUser.stickers.length > 0
            ? currentUser.stickers.map((sticker, index) => (
                <li key={index} className={cx("stickers-content_item")}>
                  <div className={cx("stickers-content_item-bg")}>
                    {editStickers && (
                      <span
                        onClick={() => {
                          handleRemoveSticker(sticker.fullPath);
                        }}
                        className={cx("stickers-content_item-cancel")}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </span>
                    )}
                    <img
                      onClick={() => {
                        handleSendMessage(sticker.url);
                      }}
                      className={cx("stickers-content_item-img")}
                      src={sticker.url}
                      alt=""
                    />
                  </div>
                </li>
              ))
            : false}
        </ul>
        {currentUser.stickers.length > 0 ? (
          <div className={cx("controls")}>
            {!editStickers ? (
              <button
                onClick={() => {
                  setEditSticker(true);
                }}
                className={cx("control-btn")}
              >
                Sửa
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditSticker(false);
                }}
                className={cx("control-btn")}
              >
                Xong
              </button>
            )}
          </div>
        ) : (
          <p className={cx("empty-sticker")}>Bạn chưa có Sticker nào</p>
        )}
      </div>
    </div>
  );
}

export default StickerModal;
