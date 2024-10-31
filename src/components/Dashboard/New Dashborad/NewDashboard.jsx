import TopSumarry from './TopSumarry';
import './NewDashboard.scss';
// import DoughnutChart from './DoughnutChart';
import ImageSlider from './ImageSlider';
import UnpaidTenantsView from './UnpaidTenantsView/UnpaidTenantsView';

function NewDashboard() {
  return (
    <div className="NewDashboard">
      <TopSumarry />
      <div className="sum">
        {/* <DoughnutChart /> */}

        <UnpaidTenantsView />
        <ImageSlider />
      </div>
    </div>
  );
}

export default NewDashboard;
