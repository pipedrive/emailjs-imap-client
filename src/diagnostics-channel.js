import diagnostics_channel from 'dc-polyfill';

export class DiagnosticsChannel {
  #channelName;

  constructor(channelName) {
    this.#channelName = channelName;
    this.channel = diagnostics_channel.channel(channelName);
  }

  publish(data) {
    this.channel.publish(data);
  }

  subscribe(cb) { 
    diagnostics_channel.subscribe(this.#channelName, cb);
  };

  unsubscribe(cb) {
    diagnostics_channel.unsubscribe(this.#channelName, cb);
  };

  hasSubscribers() {
    return this.channel.hasSubscribers;
  }
}

export const imapCommandChannel = new DiagnosticsChannel('emailjs-imap-client:command');
