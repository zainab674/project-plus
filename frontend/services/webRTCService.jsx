import Peer from 'simple-peer';
import EventEmitter from 'events';

export class WebRTC extends EventEmitter {
    peer = null;
    stream = null;
    constructor(initiator){
        super();
        this.createPeer(initiator);
        
    }

    async createPeer(initiator){
        console.log('called one time')
        this.stream = await this.getStream();
        this.peer = new Peer({initiator: initiator, stream: this.stream});

        this.onSignal = this.onSignal.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.onStream = this.onStream.bind(this);

        this.peer.on('signal',this.onSignal);
        this.peer.on('connect',this.onConnect);
        this.peer.on('stream',this.onStream);
    }

    async onSignal(data){
        this.emit('signal',data);
    }

    async onConnect(data){
        console.log('connected successfully...');
        this.emit('conncted',data);
    }

    async onStream(data){
        console.log('stream getting successfully...');
        this.emit('stream',data);
    }

    


    async getStream (){
        try {
            const stream = await window.navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 44100,    
                    channelCount: 2,      
                    noiseSuppression: true,
                }
            });
            return stream;
        } catch (error) {
            throw new Error(error.message);
        }
    }



    signal(signal){
        this.peer.signal(signal);
    }

    destroy(){
        this.peer.destroy();
    }

}