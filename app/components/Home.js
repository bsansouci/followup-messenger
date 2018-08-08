import React, { Component } from 'react';
import styles from './Home.css';
import { ipcRenderer } from 'electron';

type Props = {};

const yourID = '100009069356507';

export default class Home extends Component<Props> {
  props: Props;

  constructor(props) {
    super(props);

    this.state = {
      friendsList: [],
      threadList: [],
      currentHistory: [],
      selectedThreadID: ''
    };

    ipcRenderer.on('message', this.newMessage);
    ipcRenderer.on('getFriendsListResponse', this.getFriendsListResponse);
    ipcRenderer.on('getThreadListResponse', this.getThreadListResponse);
    ipcRenderer.on('getThreadHistoryResponse', this.getThreadHistoryResponse);
    ipcRenderer.on('sendMessageResponse', this.sendMessageResponse);

    ipcRenderer.send('getThreadList');
    ipcRenderer.send('listen');
  }

  newMessage = (event, message) => {
    if (message.threadID === this.state.selectedThreadID) {
      this.setState({
        currentHistory: this.state.currentHistory.concat([message])
      });
    }
  };

  getFriendsListResponse = (event, friendsList) => {
    console.log(event, friendsList);
    this.setState({ friendsList });
  };

  getThreadListResponse = (event, threadList) => {
    console.log(threadList[0]);
    this.setState({
      threadList: threadList.map(thread => {
        return { ...thread, snoozed: false };
      })
    });
  };

  getThreadHistoryResponse = (event, currentHistory) => {
    console.log(currentHistory);
    this.setState({ currentHistory });
  };

  openThread = threadID => {
    ipcRenderer.send('getThreadHistory', {
      threadID,
      amount: 100,
      timestamp: null
    });

    ipcRenderer.send('markAsRead', {
      threadID,
      read: true
    });

    this.setState({
      selectedThreadID: threadID,
      threadList: this.state.threadList.map(
        thread =>
          thread.threadID === threadID ? { ...thread, unreadCount: 0 } : thread
      )
    });
  };

  sendMessageResponse = (e, data) => {
    // Only care about updating the temp message we had created if we're still focused on that
    // thread, otherwise we're gonna re-fetch.
    if (this.state.selectedThreadID === data.threadID) {
      let closestSoFar = Number.MAX_VALUE;
      let closestSoFarIndex = -1;

      for (var i = 0; i < this.state.currentHistory.length; i++) {
        let diff = Math.abs(
          this.state.currentHistory[i].timestamp - data.timestamp
        );
        if (diff < closestSoFar && curMessage.messageID === 'tmp') {
          closestSoFar = diff;
          closestSoFarIndex = i;
        }
      }

      let currentHistory = this.state.currentHistory.map((message, i) => {
        if (closestSoFarIndex === i) {
          return { ...message, messageID: data.messageID };
        }

        return message;
      });

      this.setState({ currentHistory });
    }
  };

  sendMessage = () => {
    ipcRenderer.send('sendMessage', {
      threadID: this.state.selectedThreadID,
      body: this.chatInput.value
    });
    this.setState({
      currentHistory: this.state.currentHistory.concat([
        {
          messageID: 'tmp',
          body: this.chatInput.value,
          type: 'message',
          senderID: yourID,
          timestamp: Date.now()
        }
      ])
    });

    this.chatInput.value = '';
  };
  
  makeAsUnread = () => {
    ipcRenderer.send('markAsRead', {
      threadID: this.state.selectedThreadID,
      read: false
    });
    
    this.setState({
      threadList: this.state.threadList.map((thread) => 
        thread.threadID === this.state.selectedThreadID ? {...thread, unreadCount: 1} : thread)
    })
  };
  
  snooze = () => {
    console.log("snooze dude snooze");
  }

  scrollToBottom = () => {
    const scrollHeight = this.scrollview.scrollHeight;
    const height = this.scrollview.clientHeight;
    const maxScrollTop = scrollHeight - height;
    this.scrollview.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
  };

  componentDidMount() {
    this.scrollToBottom();
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  render() {
    return (
      <div className={styles.container} data-tid="container">
        <div className={styles.left_column}>
          <div className={styles.controls} />
          <div className={styles.thread_list} />
          {
            <div className={styles.thread_list}>
              {this.state.threadList.map(
                ({ threadID, name, participants, unreadCount }) => (
                  <div
                    key={threadID}
                    onClick={() => this.openThread(threadID)}
                    className={[
                      styles.thread_item,
                      threadID === this.state.selectedThreadID
                        ? styles.thread_item_selected
                        : '',
                      unreadCount > 0 ? styles.thread_item_unread : ''
                    ].join(' ')}
                  >
                    {name || participants.map(p => p.name).join(', ')}
                  </div>
                )
              )}
            </div>
          }
        </div>
        <div className={styles.right_column}>
          {this.state.selectedThreadID && 
            <div className={styles.right_column_controls}>
              <div onClick={this.makeAsUnread} style={{cursor: "pointer"}}>Make as unread</div>
              {this.state.threadList.filter(({threadID}) => threadID === this.state.selectedThreadID)[0].name}
              <div onClick={this.snooze} style={{cursor: "pointer"}}>Snooze</div>
            </div>
          }
          <div
            className={styles.chat_window}
            ref={el => {
              this.scrollview = el;
            }}
          >
            {this.state.currentHistory.map(
              ({ body, type, senderID, messageID }, i) =>
                type === 'message' ? (
                  <div
                    key={messageID === 'tmp' ? messageID + i : messageID}
                    className={[
                      styles.chat_bubble,
                      senderID == yourID ? styles.yours : styles.theirs
                    ].join(' ')}
                  >
                    <span>{body}</span>
                  </div>
                ) : (
                  'event'
                )
            )}
          </div>
          <div className={styles.chat_controls}>
            <input
              className={styles.chat_input}
              ref={el => {
                this.chatInput = el;
              }}
              onKeyPress={e => (e.key === 'Enter' ? this.sendMessage() : null)}
            />
            <button className={styles.chat_send} onClick={this.sendMessage}>
              send
            </button>
          </div>
        </div>
      </div>
    );
  }
}
