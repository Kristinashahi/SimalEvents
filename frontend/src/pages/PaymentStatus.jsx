const PaymentStatus = () => {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    
    useEffect(() => {
      const fetchBooking = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/bookings/${id}`, {
            headers: { Authorization: `Bearer ${getAuthData().token}` }
          });
          setBooking(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchBooking();
    }, [id]);
    
    const paymentStatus = new URLSearchParams(location.search).get('payment');
    
    if (loading) return <div>Loading...</div>;
    
    return (
      <div className="payment-status">
        {paymentStatus === 'success' && (
          <div className="alert alert-success">
            <h4>Payment Successful!</h4>
            <p>Your booking for {booking.service.name} is confirmed.</p>
            <p>Transaction ID: {booking.paymentId}</p>
          </div>
        )}
        
        {paymentStatus === 'failed' && (
          <div className="alert alert-danger">
            <h4>Payment Failed</h4>
            <p>Please try again or contact support.</p>
          </div>
        )}
        
        <Link to="/bookings" className="btn btn-primary">
          View All Bookings
        </Link>
      </div>
    );
  };