import Peer, { DataConnection, MediaConnection } from 'peerjs';

export class PeerClient {
    private static instance: PeerClient;
    public peer: Peer | null = null;
    public myPeerId: string | null = null;

    private connections: Map<string, DataConnection> = new Map();
    private calls: Map<string, MediaConnection> = new Map();

    private constructor() { }

    public static getInstance(): PeerClient {
        if (!PeerClient.instance) {
            PeerClient.instance = new PeerClient();
        }
        return PeerClient.instance;
    }

    public initialize(host: string, port: number, path: string = '/peerjs'): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.peer && !this.peer.destroyed) {
                if (this.myPeerId) return resolve(this.myPeerId);
            }

            // @ts-ignore
            this.peer = new Peer(undefined, {
                host,
                port,
                path,
                // debug: 3
            });

            this.peer.on('open', (id) => {
                console.log('PeerJS Connected with ID:', id);
                this.myPeerId = id;
                resolve(id);
            });

            this.peer.on('error', (err) => {
                console.error('PeerJS Error:', err);
                reject(err);
            });

            this.peer.on('connection', (conn) => {
                this.handleIncomingConnection(conn);
            });

            this.peer.on('call', (call) => {
                // Auto-answer or trigger event? 
                // For now, let's just log. Real app needs permission/logic.
                console.log('Incoming call from:', call.peer);
                // call.answer(myStream);
            });
        });
    }

    public connectToPeer(remotePeerId: string, metadata?: any) {
        if (!this.peer || this.connections.has(remotePeerId)) return;

        console.log('Connecting to peer:', remotePeerId);
        const conn = this.peer.connect(remotePeerId, { metadata });
        this.handleIncomingConnection(conn);
    }

    private handleIncomingConnection(conn: DataConnection) {
        conn.on('open', () => {
            console.log('DataConnection Open:', conn.peer);
            this.connections.set(conn.peer, conn);
        });

        conn.on('data', (data) => {
            console.log('Received data from', conn.peer, data);
            // specific peer logic here
        });

        conn.on('close', () => {
            console.log('DataConnection Closed:', conn.peer);
            this.connections.delete(conn.peer);
        });

        conn.on('error', (err) => {
            console.error('DataConnection Error:', err);
        });

        this.connections.set(conn.peer, conn);
    }

    public disconnect() {
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
            this.myPeerId = null;
            this.connections.clear();
            this.calls.clear();
        }
    }
}
