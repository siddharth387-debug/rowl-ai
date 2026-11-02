import {useState,useEffect,useCallback} from 'react';
import axios from 'axios';
import {API} from '../context/AuthContext';
import { speakCalmingVoice, triggerCalmingHeartbeat } from '../utils/sensoryCalm';


const SESSION_STORAGE_KEY ='rowl_chat_session_id';

const getInitialGreeting=(userName)=>({
    sender:'ai',
    message:`hello${userName ?`,${userName.split(' ')[0]}`:',beaytiful soul'}🌸 I'm sera,your compassionate companion here at Rowl.this is a safe ,jurgement-free space.How are you feeling today - really?`,timestamp:new Date(),});
export const useChatSession=(user)=>{
    const [sessionId,setSessionId]=useState(() =>{
        const saved=localStorage.getItem(SESSION_STORAGE_KEY);
        if(saved)return saved;
        const fresh=`session_${Date.now()}`;
        localStorage.setItem(SESSION_STORAGE_KEY,fresh)
        return fresh;
    });

    const [messages,setMessages]=useState([getInitialGreeting(user?.name)]);
    const [loading,setLoading]=useState(false);
    const[crisisActive,setCrisisActive]=useState(false);
    const [calmModeOpen, setCalmModeOpen] = useState(false);
    const [sosStatus, setSosStatus] = useState(null);
    const[selectedMood,setSelectedMood]=useState('');
    const[showMoods,setShowMoods]=useState(true);


    useEffect(()=>{
        let isMounted=true;

        const loadHistory=async()=>{
            try{
                if(user?.id){
                    const res=await axios.get(`${API}/chat/user-session/${user.id}`);
                    if(isMounted && res.data.sessionId && res.data.messages?.length > 0){
                        setSessionId(res.data.sessionId);
                        localStorage.setItem(SESSION_STORAGE_KEY,res.data.sessionId);
                        setMessages(res.data.messages);
                        setShowMoods(false);
                        setCrisisActive(res.data.messages.some((m)=>m.isCrisis));
                        return;
                    }
                }
                const res=await axios.get(`${API}/chat/history/${sessionId}`);
                if(isMounted && res.data?.length > 0){
                    setMessages(res.data);
                    setShowMoods(false);
                    setCrisisActive(res.data.some((m)=>m.isCrisis))
                }
            }catch{

            }
        };
        loadHistory();
        return()=>{
            isMounted=false;
        };
    },[user?.id,sessionId]);

    const sendMessage=useCallback(async(text,moodOverride='')=>{
        const trimmed=(text || '').trim();
        if(!trimmed)return;


        const userMsg={
            sender:'user',
            message:trimmed,
            mood:moodOverride || selectedMood,
            timestamp:new Date(),
        };


        setMessages((prev)=>[...prev,userMsg]);
        setLoading(true);
        setShowMoods(false);

        try{
            const res=await axios.post(`${API}/chat/send`,{
                message:trimmed,
                sessionId,
                userId:user?.id || user?._id,
                userEmail:user?.email,
                userName:user?.name,
                userPhone:user?.phone,
                emergencyContact:user?.emergencyContact,
                mood:moodOverride ||selectedMood,
            });

            if(res.data.isCrisis){
                setCrisisActive(true);
            }
            if (res.data.crisisEscalated) {
                setCalmModeOpen(true);
                if (res.data.sosStatus) setSosStatus(res.data.sosStatus);
                triggerCalmingHeartbeat();
                speakCalmingVoice(user?.name);
            }
            setMessages((prev)=>[
                ...prev,
                {
                    sender:'ai',
                    message:res.data.response,
                    isCrisis:res.data.isCrisis,
                    actionCard:res.data.actionCard,
                    timestamp:res.data.timestamp || new Date(),

                },
            ]);
            }catch{
                setMessages((prev)=>[
                    ...prev,
                    {
                        sender:'ai',
                        message:"I'm here with you.sometimes my connection wavers,but my care for you never does.please try again.💛",
                        timestamp:new Date()
                    },
                ]);
        }finally{
            setLoading(false);
        }
    },
    [sessionId, user?.id, user?.name, selectedMood]
    );

    const startNewSession=useCallback(()=>{
        const fresh=`session_${Date.now()}`;
        localStorage.setItem(SESSION_STORAGE_KEY,fresh);
        setSessionId(fresh);
        setMessages([getInitialGreeting(user?.name)]);
        setShowMoods(true);
        setCrisisActive(false);
        setCalmModeOpen(false);
        setSelectedMood('');

    },[user?.name]);

    return{
        messages,
        loading,
        crisisActive,
        setCrisisActive,
        calmModeOpen,
        setCalmModeOpen,
        sosStatus,
        selectedMood,
        setSelectedMood,
        showMoods,
        sendMessage,
        startNewSession,
    };

};